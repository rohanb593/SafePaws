import { Pet } from '@/src/types/Pet'
import { Text, View, StyleSheet } from 'react-native'
import Card from '@/src/components/common/Card'

interface PetCardProps {
  pet: Pet
  onPress: () => void
  selected?: boolean
}

function getPetEmoji(petType: string): string {
  const type = petType.toLowerCase()
  if (type.includes('dog')) return '🐶'
  if (type.includes('cat')) return '🐱'
  if (type.includes('bird')) return '🐦'
  if (type.includes('fish')) return '🐠'
  return '🐾'
}

export default function PetCard({ pet, onPress, selected = false }: PetCardProps) {
  return (
    <Card onPress={onPress} style={[styles.card, selected && styles.selected]}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{getPetEmoji(pet.pet_type)}</Text>
        <View style={styles.textBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {pet.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {pet.pet_type}
            {pet.breed ? ` · ${pet.breed}` : ''}
          </Text>
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    minWidth: 180,
    marginRight: 12,
    marginBottom: 0,
  },
  selected: {
    borderWidth: 1,
    borderColor: '#2E7D32',
    backgroundColor: '#f1f8f4',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 28,
  },
  textBlock: {
    flex: 1,
  },
  name: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  meta: { fontSize: 13, color: '#555' },
})
