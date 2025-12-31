-- Update the default value for future users
ALTER TABLE public.profiles
ALTER COLUMN bits_coin_balance SET DEFAULT 1000.00;

-- Optional: Update existing users who have the old default (100) to 1000
-- Uncomment the following lines if you want to retroactive apply this to users who haven't spent/earned coins
-- UPDATE public.profiles
-- SET bits_coin_balance = 1000.00
-- WHERE bits_coin_balance = 100.00;
