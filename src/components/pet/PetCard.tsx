import { Pet } from '@/src/types/Pet'
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native'

interface PetCardProps {
  pet: Pet
  onPress?: () => void
  selected?: boolean
}

export default function PetCard({ pet, onPress, selected }: PetCardProps) {
  const content = (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <Text style={styles.name}>{pet.name}</Text>
      <Text style={styles.meta}>
        {pet.pet_type}
        {pet.breed ? ` · ${pet.breed}` : ''}
      </Text>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: 12,
  },
  cardSelected: { borderColor: '#2E7D32', backgroundColor: '#f1f8f4' },
  name: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  meta: { fontSize: 13, color: '#555' },
})
