// Pet summary card
//
// Props:
//   pet: Pet                  — the pet data
//   onPress?: () => void      — optional navigation handler
//   selectable?: boolean      — if true, shows selection state
//   selected?: boolean        — whether this pet is currently selected
//
// Displays: pet name, pet_type, breed

// TODO: Replace Card import with project-specific component
import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Card from '../common/Card'; // change this path if needed
import { Pet } from '../../types'; // change this path if needed

type Props = {
  pet: Pet;
  onPress: () => void;
};

// TEMP: replace Card if import unknown
const Card = ({ children }: any) => <View>{children}</View>;
const getPetEmoji = (petType?: string) => {
  const type = petType?.toLowerCase();

  switch (type) {
    case 'dog':
      return '🐶';
    case 'cat':
      return '🐱';
    case 'bird':
      return '🐦';
    case 'fish':
      return '🐠';
    default:
      return '🐾';
  }
};

export default function PetCard({ pet, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.container}>
          <Text style={styles.name}>
            {getPetEmoji(pet.pet_type)} {pet.name}
          </Text>

          <Text style={styles.detail}>
            Type: {pet.pet_type || 'Not recorded'}
          </Text>

          <Text style={styles.detail}>
            Breed: {pet.breed || 'Not recorded'}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  detail: {
    fontSize: 14,
    color: '#555',
  },
});

