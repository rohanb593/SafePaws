// Pet medical record display card
//
// Props:
//   record: MedicalRecord
//
// Displays:
//   vet_name, vet_clinic, vet_phone
//   VaccineRecord list (vaccine_name, date_administered, next_due_date)
//   medical_history
//   allergies (one Badge per allergy)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// import Card from '...'
// import { Badge } from '...'
// import { MedicalRecord } from '...'

// TODO: replace imports with project-specific ones

type MedicalRecord = {
  vet_name?: string;
  vet_clinic?: string;
  vet_phone?: string;
  medical_history?: string;
  allergies?: string[];
  vaccine_info?: {
    name?: string;
    date?: string;
    next_due?: string;
  }[];
};

type Props = {
  record: MedicalRecord;
};

const placeholder = 'Not recorded';

// TEMP fallback if Card not found
const Card = ({ children }: any) => <View style={styles.card}>{children}</View>;

// TEMP fallback if Badge not found
const Badge = ({ children }: any) => (
  <View style={styles.badge}>
    <Text>{children}</Text>
  </View>
);

export default function MedicalRecordCard({ record }: Props) {
  const allergies = record.allergies || [];
  const vaccines = record.vaccine_info || [];

  return (
    <Card>
      {/* Vet Info */}
      <View style={styles.section}>
        <Text style={styles.title}>Vet Contact</Text>
        <Text>{record.vet_name || placeholder}</Text>
        <Text>{record.vet_clinic || placeholder}</Text>
        <Text>{record.vet_phone || placeholder}</Text>
      </View>

      {/* Vaccines */}
      <View style={styles.section}>
        <Text style={styles.title}>Vaccines</Text>
        {vaccines.length > 0 ? (
          vaccines.map((vaccine, index) => (
            <View key={index}>
              <Text>{vaccine.name || placeholder}</Text>
              <Text>Date: {vaccine.date || placeholder}</Text>
              <Text>Next due: {vaccine.next_due || placeholder}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
      </View>

      {/* Allergies */}
      <View style={styles.section}>
        <Text style={styles.title}>Allergies</Text>
        {allergies.length > 0 ? (
          <View style={styles.badgeContainer}>
            {allergies.map((allergy, index) => (
              <Badge key={index}>{allergy}</Badge>
            ))}
          </View>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
      </View>

      {/* Medical History */}
      <View style={styles.section}>
        <Text style={styles.title}>Medical History</Text>
        <Text>
          {record.medical_history || placeholder}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  placeholder: {
    color: '#888',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ffe5e5',
    borderRadius: 8,
  },
});
