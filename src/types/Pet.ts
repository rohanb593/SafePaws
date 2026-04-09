// Pet — owned by PetOwner, 0..* per owner (RQ4, RQ15, RQ30)
//
// Table: pets
// Columns:
//   id: string (uuid, primary key)
//   owner_id: string (uuid, FK → profiles.id)
//   pet_type: string       (e.g. 'Dog', 'Cat', 'Rabbit')
//   breed: string
//   name: string
//   created_at: string
//
// RLS: owner can only see/edit their own pets
//
// Exports: Pet interface, NewPetInput interface

export interface Pet {
  id: string
  owner_id: string
  pet_type: string
  breed: string
  name: string
  created_at: string
}

export interface NewPetInput {
  owner_id: string
  pet_type: string
  breed: string
  name: string
}
