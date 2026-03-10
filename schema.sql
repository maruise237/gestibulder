/* 
  GESTIBULDER - SCHEMA INITIAL
  Exécutez ce script dans l'éditeur SQL de Supabase pour initialiser les tables.
*/

-- 1. Table ENTREPRISES
CREATE TABLE entreprises (
    id UUID PRIMARY KEY, -- Lié au user admin (auth.users.id)
    admin_id UUID NOT NULL REFERENCES auth.users(id), -- Add this to match current DB
    nom TEXT NOT NULL,
    pays TEXT NOT NULL DEFAULT 'Algérie',
    devise TEXT DEFAULT 'DZD',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table PROFILES (Utilisateurs de l'entreprise)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'chef_projet', 'superviseur')) NOT NULL DEFAULT 'admin',
    nom_complet TEXT NOT NULL,
    telephone TEXT,
    chantiers_assignes UUID[] DEFAULT '{}',
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table CHANTIERS
CREATE TABLE chantiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE NOT NULL,
    nom TEXT NOT NULL,
    adresse TEXT,
    date_debut DATE,
    date_fin_prevue DATE,
    budget_total NUMERIC(15,2) DEFAULT 0,
    statut TEXT CHECK (statut IN ('preparation', 'en_cours', 'pause', 'termine')) DEFAULT 'preparation',
    avancement_pct INTEGER CHECK (avancement_pct >= 0 AND avancement_pct <= 100) DEFAULT 0,
    superviseur_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table OUVRIERS
CREATE TABLE ouvriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE NOT NULL,
    chantier_ids UUID[] DEFAULT '{}',
    nom_complet TEXT NOT NULL,
    telephone TEXT,
    metier TEXT NOT NULL,
    metier_custom TEXT,
    unite_production TEXT DEFAULT 'Journée de travail',
    type_paiement TEXT CHECK (type_paiement IN ('journalier', 'hebdomadaire', 'mensuel')) DEFAULT 'journalier',
    taux_journalier NUMERIC(10,2),
    salaire_hebdo NUMERIC(10,2),
    salaire_mensuel NUMERIC(10,2),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table POINTAGES
CREATE TABLE pointages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE NOT NULL,
    chantier_id UUID REFERENCES chantiers(id) ON DELETE CASCADE NOT NULL,
    ouvrier_id UUID REFERENCES ouvriers(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    statut TEXT CHECK (statut IN ('present', 'absent', 'absent_justifie')) NOT NULL,
    heure_arrivee TIME,
    heure_depart TIME,
    quantite_produite NUMERIC(10,2) DEFAULT 0,
    note TEXT,
    saisi_par UUID REFERENCES profiles(id),
    salaire_jour NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(ouvrier_id, date) -- Un ouvrier ne peut être pointé qu'une fois par jour
);

-- 6. Table MATERIAUX
CREATE TABLE materiaux (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE NOT NULL,
    chantier_id UUID REFERENCES chantiers(id) ON DELETE CASCADE NOT NULL,
    nom TEXT NOT NULL,
    unite TEXT NOT NULL,
    seuil_alerte INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Table MOUVEMENTS_STOCK
CREATE TABLE mouvements_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE NOT NULL,
    chantier_id UUID REFERENCES chantiers(id) ON DELETE CASCADE NOT NULL,
    materiau_id UUID REFERENCES materiaux(id) ON DELETE CASCADE NOT NULL,
    type_mouvement TEXT CHECK (type_mouvement IN ('entree', 'sortie')) NOT NULL,
    quantite NUMERIC(10,2) NOT NULL,
    cout_unitaire NUMERIC(10,2),
    date DATE NOT NULL,
    saisi_par UUID REFERENCES profiles(id),
    fournisseur TEXT,
    usage TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Table EQUIPEMENTS
CREATE TABLE equipements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE NOT NULL,
    nom TEXT NOT NULL,
    categorie TEXT,
    numero_serie TEXT,
    etat TEXT CHECK (etat IN ('disponible', 'en_service', 'en_transit', 'en_maintenance', 'hors_service')) DEFAULT 'disponible',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Table AFFECTATIONS_EQUIPEMENTS
CREATE TABLE affectations_equipements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE NOT NULL,
    equipement_id UUID REFERENCES equipements(id) ON DELETE CASCADE NOT NULL,
    chantier_id UUID REFERENCES chantiers(id) ON DELETE CASCADE NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    saisi_par UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Table DEPENSES
CREATE TABLE depenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE NOT NULL,
    chantier_id UUID REFERENCES chantiers(id) ON DELETE CASCADE NOT NULL,
    poste TEXT NOT NULL,
    montant NUMERIC(15,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    saisi_par UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ACTIVATION RLS (Row Level Security)
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ouvriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pointages ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE affectations_equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;

-- POLITIQUES RLS DE BASE (Isolent les données par entreprise)
-- L'accès est donné si l'utilisateur fait partie de l'entreprise via son entreprise_id dans JWT ou s'il requiert via API
-- Pour un MVP simple on permet tout accès aux authentifiés (à affiner plus tard)
CREATE POLICY "Permettre tout accès aux authentifiés" ON entreprises FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permettre tout accès aux authentifiés" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permettre tout accès aux authentifiés" ON chantiers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permettre tout accès aux authentifiés" ON ouvriers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permettre tout accès aux authentifiés" ON pointages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permettre tout accès aux authentifiés" ON materiaux FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permettre tout accès aux authentifiés" ON mouvements_stock FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permettre tout accès aux authentifiés" ON equipements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permettre tout accès aux authentifiés" ON affectations_equipements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permettre tout accès aux authentifiés" ON depenses FOR ALL USING (auth.role() = 'authenticated');

-- Triggers pour création automatique entreprise/profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  target_ent_id UUID;
BEGIN
  -- 1. Vérifier si c'est une invitation (enterprise_id présent dans meta_data)
  IF (new.raw_user_meta_data->>'enterprise_id') IS NOT NULL THEN
    target_ent_id := (new.raw_user_meta_data->>'enterprise_id')::UUID;
  ELSE
    -- Créer une nouvelle entreprise pour les inscriptions standards
    INSERT INTO public.entreprises (id, nom)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'enterprise_name', 'Ma Nouvelle Entreprise'))
    RETURNING id INTO target_ent_id;
  END IF;

  -- 2. Créer le profil
  INSERT INTO public.profiles (id, entreprise_id, nom_complet, role)
  VALUES (
    new.id, 
    target_ent_id, 
    COALESCE(new.raw_user_meta_data->>'nom_complet', 'Utilisateur'), 
    COALESCE(new.raw_user_meta_data->>'invited_role', 'admin')
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà pour éviter les erreurs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
