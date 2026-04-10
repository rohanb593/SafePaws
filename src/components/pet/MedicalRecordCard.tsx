import { MedicalRecord } from '@/src/types/MedicalRecord'
import { Text, View, StyleSheet } from 'react-native'
import Badge from '@/src/components/common/Badge'
import { formatDate } from '@/src/utils/formatDate'

interface MedicalRecordCardProps {
  record: MedicalRecord
}

export default function MedicalRecordCard({ record }: MedicalRecordCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Vet</Text>
      <Text style={styles.line}>{record.vet_name}</Text>
      <Text style={styles.lineMuted}>{record.vet_clinic}</Text>
      <Text style={styles.lineMuted}>{record.vet_phone}</Text>

      {record.vaccine_info?.length ? (
        <>
          <Text style={[styles.sectionTitle, styles.gap]}>Vaccinations</Text>
          {record.vaccine_info.map((v, i) => (
            <View key={`${v.vaccine_name}-${i}`} style={styles.vaxRow}>
              <Text style={styles.line}>{v.vaccine_name}</Text>
              <Text style={styles.lineMuted}>
                Given {formatDate(v.date_administered)}
                {v.next_due_date ? ` · Next ${formatDate(v.next_due_date)}` : ''}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      {record.medical_history ? (
        <>
          <Text style={[styles.sectionTitle, styles.gap]}>Medical history</Text>
          <Text style={styles.body}>{record.medical_history}</Text>
        </>
      ) : null}

      {record.allergies?.length ? (
        <>
          <Text style={[styles.sectionTitle, styles.gap]}>Allergies</Text>
          <View style={styles.badges}>
            {record.allergies.map(a => (
              <Badge key={a} label={a} variant="warning" />
            ))}
          </View>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 6 },
  gap: { marginTop: 14 },
  line: { fontSize: 15, color: '#222', marginBottom: 2 },
  lineMuted: { fontSize: 14, color: '#666', marginBottom: 2 },
  body: { fontSize: 14, color: '#444', lineHeight: 20 },
  vaxRow: { marginBottom: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})
