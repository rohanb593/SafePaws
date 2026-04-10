import { MedicalRecord } from '@/src/types/MedicalRecord'
import { Text, View, StyleSheet } from 'react-native'
import Badge from '@/src/components/common/Badge'
import { formatDate } from '@/src/utils/formatDate'
import Card from '@/src/components/common/Card'

interface MedicalRecordCardProps {
  record: MedicalRecord
}

export default function MedicalRecordCard({ record }: MedicalRecordCardProps) {
  const valueOrFallback = (value?: string | null) =>
    value && value.trim().length ? value : 'Not recorded'

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Vet</Text>
      <Text style={styles.line}>{valueOrFallback(record.vet_name)}</Text>
      <Text style={styles.lineMuted}>{valueOrFallback(record.vet_clinic)}</Text>
      <Text style={styles.lineMuted}>{valueOrFallback(record.vet_phone)}</Text>

      <Text style={[styles.sectionTitle, styles.gap]}>Vaccinations</Text>
      {record.vaccine_info?.length ? (
        record.vaccine_info.map((v, i) => (
          <View key={`${v.vaccine_name}-${i}`} style={styles.vaxRow}>
            <Text style={styles.line}>{valueOrFallback(v.vaccine_name)}</Text>
            <Text style={styles.lineMuted}>
              Date: {v.date_administered ? formatDate(v.date_administered) : 'Not recorded'}
            </Text>
            <Text style={styles.lineMuted}>
              Next due: {v.next_due_date ? formatDate(v.next_due_date) : 'Not recorded'}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.placeholder}>Not recorded</Text>
      )}

      <Text style={[styles.sectionTitle, styles.gap]}>Allergies</Text>
      {record.allergies?.length ? (
        <View style={styles.badges}>
          {record.allergies.map(a => (
            <Badge key={a} label={a} variant="warning" />
          ))}
        </View>
      ) : (
        <Text style={styles.placeholder}>Not recorded</Text>
      )}

      <Text style={[styles.sectionTitle, styles.gap]}>Medical history</Text>
      <Text style={styles.body}>{valueOrFallback(record.medical_history)}</Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 0,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 6 },
  gap: { marginTop: 14 },
  line: { fontSize: 15, color: '#222', marginBottom: 2 },
  lineMuted: { fontSize: 14, color: '#666', marginBottom: 2 },
  body: { fontSize: 14, color: '#444', lineHeight: 20 },
  placeholder: { fontSize: 14, color: '#9a9a9a', fontStyle: 'italic' },
  vaxRow: { marginBottom: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})
