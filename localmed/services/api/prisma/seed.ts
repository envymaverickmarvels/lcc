import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const medicines = await Promise.all([
    prisma.medicine.upsert({
      where: { id: 'med-001' },
      update: {},
      create: {
        id: 'med-001',
        name: 'Paracetamol 500',
        genericName: 'Acetaminophen',
        manufacturer: 'Cipla',
        category: 'Analgesic',
        composition: 'Paracetamol 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        requiresPrescription: false,
        isEssential: true,
      },
    }),
    prisma.medicine.upsert({
      where: { id: 'med-002' },
      update: {},
      create: {
        id: 'med-002',
        name: 'Paracetamol 650',
        genericName: 'Acetaminophen',
        manufacturer: 'Cipla',
        category: 'Analgesic',
        composition: 'Paracetamol 650mg',
        dosageForm: 'Tablet',
        strength: '650mg',
        requiresPrescription: false,
        isEssential: true,
      },
    }),
    prisma.medicine.upsert({
      where: { id: 'med-003' },
      update: {},
      create: {
        id: 'med-003',
        name: 'Amoxicillin 500',
        genericName: 'Amoxicillin',
        manufacturer: 'Sun Pharma',
        category: 'Antibiotic',
        composition: 'Amoxicillin 500mg',
        dosageForm: 'Capsule',
        strength: '500mg',
        requiresPrescription: true,
        isEssential: false,
      },
    }),
    prisma.medicine.upsert({
      where: { id: 'med-004' },
      update: {},
      create: {
        id: 'med-004',
        name: 'Azithromycin 500',
        genericName: 'Azithromycin',
        manufacturer: 'Cipla',
        category: 'Antibiotic',
        composition: 'Azithromycin 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        requiresPrescription: true,
        isEssential: false,
      },
    }),
    prisma.medicine.upsert({
      where: { id: 'med-005' },
      update: {},
      create: {
        id: 'med-005',
        name: 'Cetirizine 10',
        genericName: 'Cetirizine',
        manufacturer: 'Sun Pharma',
        category: 'Antihistamine',
        composition: 'Cetirizine 10mg',
        dosageForm: 'Tablet',
        strength: '10mg',
        requiresPrescription: false,
        isEssential: false,
      },
    }),
    prisma.medicine.upsert({
      where: { id: 'med-006' },
      update: {},
      create: {
        id: 'med-006',
        name: 'Pantoprazole 40',
        genericName: 'Pantoprazole',
        manufacturer: 'Cipla',
        category: 'Gastrointestinal',
        composition: 'Pantoprazole 40mg',
        dosageForm: 'Tablet',
        strength: '40mg',
        requiresPrescription: true,
        isEssential: true,
      },
    }),
    prisma.medicine.upsert({
      where: { id: 'med-007' },
      update: {},
      create: {
        id: 'med-007',
        name: 'Metformin 500',
        genericName: 'Metformin',
        manufacturer: 'Sun Pharma',
        category: 'Antidiabetic',
        composition: 'Metformin 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        requiresPrescription: true,
        isEssential: true,
      },
    }),
    prisma.medicine.upsert({
      where: { id: 'med-008' },
      update: {},
      create: {
        id: 'med-008',
        name: 'Amlodipine 5',
        genericName: 'Amlodipine',
        manufacturer: 'Cipla',
        category: 'Antihypertensive',
        composition: 'Amlodipine 5mg',
        dosageForm: 'Tablet',
        strength: '5mg',
        requiresPrescription: true,
        isEssential: true,
      },
    }),
    prisma.medicine.upsert({
      where: { id: 'med-009' },
      update: {},
      create: {
        id: 'med-009',
        name: 'Salbutamol Inhaler',
        genericName: 'Salbutamol',
        manufacturer: 'Cipla',
        category: 'Respiratory',
        composition: 'Salbutamol 100mcg',
        dosageForm: 'Inhaler',
        strength: '100mcg',
        requiresPrescription: true,
        isEssential: true,
      },
    }),
    prisma.medicine.upsert({
      where: { id: 'med-010' },
      update: {},
      create: {
        id: 'med-010',
        name: 'Insulin Glargine',
        genericName: 'Insulin Glargine',
        manufacturer: 'Sanofi',
        category: 'Antidiabetic',
        composition: 'Insulin Glargine 100IU/ml',
        dosageForm: 'Injection',
        strength: '100IU/ml',
        requiresPrescription: true,
        isEssential: true,
      },
    }),
  ]);

  console.log(`Created ${medicines.length} medicines`);

  const categories = await Promise.all([
    prisma.medicineCategory.upsert({
      where: { id: 'cat-001' },
      update: {},
      create: { id: 'cat-001', name: 'Analgesic', sortOrder: 1, isActive: true },
    }),
    prisma.medicineCategory.upsert({
      where: { id: 'cat-002' },
      update: {},
      create: { id: 'cat-002', name: 'Antibiotic', sortOrder: 2, isActive: true },
    }),
    prisma.medicineCategory.upsert({
      where: { id: 'cat-003' },
      update: {},
      create: { id: 'cat-003', name: 'Antihistamine', sortOrder: 3, isActive: true },
    }),
    prisma.medicineCategory.upsert({
      where: { id: 'cat-004' },
      update: {},
      create: { id: 'cat-004', name: 'Gastrointestinal', sortOrder: 4, isActive: true },
    }),
    prisma.medicineCategory.upsert({
      where: { id: 'cat-005' },
      update: {},
      create: { id: 'cat-005', name: 'Antidiabetic', sortOrder: 5, isActive: true },
    }),
    prisma.medicineCategory.upsert({
      where: { id: 'cat-006' },
      update: {},
      create: { id: 'cat-006', name: 'Antihypertensive', sortOrder: 6, isActive: true },
    }),
    prisma.medicineCategory.upsert({
      where: { id: 'cat-007' },
      update: {},
      create: { id: 'cat-007', name: 'Respiratory', sortOrder: 7, isActive: true },
    }),
  ]);

  console.log(`Created ${categories.length} categories`);

  const owner = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      id: 'user-owner-001',
      phone: '+919876543210',
      name: 'Rajesh Sharma',
      email: 'rajesh@sharmamedicos.com',
      isPharmacyOwner: true,
      isVerified: true,
    },
  });

  const testUser = await prisma.user.upsert({
    where: { phone: '+919876543211' },
    update: {},
    create: {
      id: 'user-test-001',
      phone: '+919876543211',
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      isVerified: true,
    },
  });

  console.log('Created users');

  const pharmacies = await Promise.all([
    prisma.pharmacy.upsert({
      where: { id: 'pharm-001' },
      update: {},
      create: {
        id: 'pharm-001',
        ownerId: owner.id,
        name: 'Sharma Medicos',
        licenseNumber: 'DL-12345',
        address: 'Shop 12, Main Road, Karol Bagh, New Delhi - 110005',
        phone: '+919876543210',
        email: 'contact@sharmamedicos.com',
        location: {} as never,
        openingTime: '08:00',
        closingTime: '22:00',
        is24h: false,
        isDelivery: true,
        deliveryRadiusKm: 5,
        rating: 4.5,
        totalReviews: 42,
        isActive: true,
      },
    }),
    prisma.pharmacy.upsert({
      where: { id: 'pharm-002' },
      update: {},
      create: {
        id: 'pharm-002',
        name: 'Apollo Pharmacy',
        licenseNumber: 'DL-67890',
        address: '15, Connaught Place, New Delhi - 110001',
        phone: '+919876543212',
        location: {} as never,
        openingTime: '07:00',
        closingTime: '23:00',
        is24h: false,
        isDelivery: true,
        deliveryRadiusKm: 3,
        rating: 4.2,
        totalReviews: 89,
        isActive: true,
      },
    }),
    prisma.pharmacy.upsert({
      where: { id: 'pharm-003' },
      update: {},
      create: {
        id: 'pharm-003',
        name: 'MedPlus 24/7',
        licenseNumber: 'DL-11111',
        address: '42, Rajendra Place, New Delhi - 110008',
        phone: '+919876543213',
        location: {} as never,
        openingTime: '00:00',
        closingTime: '23:59',
        is24h: true,
        isDelivery: true,
        deliveryRadiusKm: 8,
        rating: 4.0,
        totalReviews: 156,
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${pharmacies.length} pharmacies`);

  for (const pharmacy of pharmacies) {
    for (const medicine of medicines) {
      await prisma.pharmacyStock.upsert({
        where: {
          pharmacyId_medicineId: {
            pharmacyId: pharmacy.id,
            medicineId: medicine.id,
          },
        },
        update: {},
        create: {
          pharmacyId: pharmacy.id,
          medicineId: medicine.id,
          sellingPrice: Math.round(Math.random() * 50 + 30),
          mrp: Math.round(Math.random() * 60 + 40),
          stockQuantity: Math.floor(Math.random() * 100 + 10),
          reorderLevel: 10,
          isAvailable: true,
        },
      });
    }
  }

  console.log('Created pharmacy stock');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
