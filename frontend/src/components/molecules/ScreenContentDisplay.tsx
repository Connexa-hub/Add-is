
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText } from '../atoms';
import { useAppTheme } from '../../hooks/useAppTheme';
import { API_BASE_URL } from '../../../constants/api';

interface ScreenContent {
  _id: string;
  screenName: string;
  contentType: 'banner' | 'promotion' | 'announcement' | 'tip' | 'alert';
  title?: string;
  description?: string;
  imageUrl?: string;
  actionType?: 'none' | 'url' | 'screen' | 'service' | 'external';
  actionValue?: string;
  priority: number;
  displayOrder: number;
  isActive: boolean;
}

interface ScreenContentDisplayProps {
  screenName: string;
  contentType?: string;
  onNavigate?: (screen: string, params?: any) => void;
}

export const ScreenContentDisplay: React.FC<ScreenContentDisplayProps> = ({
  screenName,
  contentType,
  onNavigate,
}) => {
  const { tokens } = useAppTheme();
  const [content, setContent] = useState<ScreenContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [screenName, contentType]);

  const fetchContent = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${API_BASE_URL}/api/vtu/screen-content/${screenName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success && data.data && Array.isArray(data.data.content)) {
        let filteredContent = data.data.content;
        
        if (contentType) {
          filteredContent = filteredContent.filter(
            (item: ScreenContent) => item.contentType === contentType
          );
        }
        
        setContent(filteredContent);
      }
    } catch (error) {
      console.error('Error fetching screen content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = async (item: ScreenContent) => {
    if (!item.actionType || item.actionType === 'none') return;

    try {
      if (item.actionType === 'url' || item.actionType === 'external') {
        if (item.actionValue) {
          await Linking.openURL(item.actionValue);
        }
      } else if (item.actionType === 'screen' && onNavigate) {
        if (item.actionValue) {
          onNavigate(item.actionValue);
        }
      }
    } catch (error) {
      console.error('Error handling content action:', error);
    }
  };

  const renderContentItem = (item: ScreenContent) => {
    const isPressable = item.actionType && item.actionType !== 'none';

    const ContentWrapper = isPressable ? TouchableOpacity : View;

    return (
      <ContentWrapper
        key={item._id}
        style={[
          styles.contentItem,
          item.contentType === 'banner' && styles.bannerItem,
          item.contentType === 'promotion' && styles.promotionItem,
          item.contentType === 'announcement' && styles.announcementItem,
          item.contentType === 'tip' && styles.tipItem,
          item.contentType === 'alert' && styles.alertItem,
        ]}
        onPress={isPressable ? () => handleContentPress(item) : undefined}
        activeOpacity={isPressable ? 0.7 : 1}
      >
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.contentImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.contentText}>
          {item.title && (
            <AppText variant="h3" weight="bold" style={styles.contentTitle}>
              {item.title}
            </AppText>
          )}
          
          {item.description && (
            <AppText variant="body2" style={styles.contentDescription}>
              {item.description}
            </AppText>
          )}
        </View>
      </ContentWrapper>
    );
  };

  if (loading || content.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {content.map(renderContentItem)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  contentItem: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerItem: {
    backgroundColor: '#6366f1',
  },
  promotionItem: {
    backgroundColor: '#10b981',
  },
  announcementItem: {
    backgroundColor: '#f59e0b',
  },
  tipItem: {
    backgroundColor: '#3b82f6',
  },
  alertItem: {
    backgroundColor: '#ef4444',
  },
  contentImage: {
    width: '100%',
    height: 150,
  },
  contentText: {
    padding: 16,
  },
  contentTitle: {
    marginBottom: 8,
    color: '#1A1A1A',
  },
  contentDescription: {
    color: '#666',
  },
});

export default ScreenContentDisplay;
