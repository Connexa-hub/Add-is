
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AppButton } from '../src/components/atoms';
import { BannerCarousel } from '../src/components/molecules';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function EducationScreen({ navigation }: any) {
  const { tokens } = useAppTheme();

  return (
    <View style={styles.container}>
      <Appbar.Header style={[styles.header, { backgroundColor: tokens.colors.primary.main }]}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
        <Appbar.Content title="Education Services" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <BannerCarousel section="education" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.comingSoonCard}>
          <View style={[styles.iconContainer, { backgroundColor: tokens.colors.warning.light }]}>
            <Ionicons name="school-outline" size={80} color={tokens.colors.warning.main} />
          </View>
          
          <AppText 
            variant="h2" 
            weight="bold" 
            align="center"
            style={{ marginTop: tokens.spacing.lg, color: tokens.colors.text.primary }}
          >
            Education Services
          </AppText>
          
          <AppText 
            variant="h3" 
            weight="semibold"
            align="center"
            style={{ marginTop: tokens.spacing.sm, color: tokens.colors.warning.main }}
          >
            Coming Soon!
          </AppText>
          
          <AppText 
            variant="body1" 
            color={tokens.colors.text.secondary}
            align="center"
            style={{ marginTop: tokens.spacing.base, lineHeight: 24, paddingHorizontal: tokens.spacing.lg }}
          >
            Educational services and exam pin purchases will be available here soon.
          </AppText>

          <View style={[styles.featureList, { marginTop: tokens.spacing.xl }]}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={tokens.colors.success.main} />
              <AppText variant="body2" style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                WAEC Result Checker
              </AppText>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={tokens.colors.success.main} />
              <AppText variant="body2" style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                NECO Exam Pins
              </AppText>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={tokens.colors.success.main} />
              <AppText variant="body2" style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                JAMB Registration & E-Pins
              </AppText>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={tokens.colors.success.main} />
              <AppText variant="body2" style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                GCE & NABTEB Pins
              </AppText>
            </View>
          </View>

          <AppButton
            onPress={() => navigation.goBack()}
            variant="primary"
            size="lg"
            fullWidth
            style={{ marginTop: tokens.spacing.xl }}
          >
            Go Back to Home
          </AppButton>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    elevation: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureList: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
