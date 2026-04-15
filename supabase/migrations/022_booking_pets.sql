-- Many-to-many: a booking can include 1–3 pets (primary `bookings.pet_id` remains the first pet for backward compatibility).

CREATE TABLE public.booking_pets (
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  PRIMARY KEY (booking_id, pet_id)
);

CREATE INDEX booking_pets_pet_id_idx ON public.booking_pets (pet_id);

INSERT INTO public.booking_pets (booking_id, pet_id)
SELECT id, pet_id FROM public.bookings;

CREATE OR REPLACE FUNCTION public.enforce_booking_pets_max()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM public.booking_pets WHERE booking_id = NEW.booking_id
  ) >= 3 THEN
    RAISE EXCEPTION 'A booking may include at most 3 pets';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_booking_pets_max
  BEFORE INSERT ON public.booking_pets
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_booking_pets_max();
