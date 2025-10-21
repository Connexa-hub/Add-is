import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { AppText } from '../atoms';
import { useAppTheme } from '../../hooks/useAppTheme';

export const DropdownModal = ({ visible, options, onSelect, onClose }) => {
  const { tokens } = useAppTheme();

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: tokens.colors.background.paper }]}>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onSelect(item)} style={styles.option}>
                <AppText>{item}</AppText>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <AppText color={tokens.colors.primary.main}>Close</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
  },
  option: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 10,
    alignItems: 'center',
  },
});
