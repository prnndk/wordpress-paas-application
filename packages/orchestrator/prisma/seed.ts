import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@wppaas.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Administrator';

    console.log('🌱 Seeding admin user...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (existingAdmin) {
        // Update existing user to be admin
        await prisma.user.update({
            where: { email: adminEmail },
            data: { role: 'admin', isActive: true },
        });
        console.log(`✅ User ${adminEmail} updated to admin role`);
    } else {
        // Create new admin user
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash,
                name: adminName,
                role: 'admin',
                isActive: true,
            },
        });
        console.log(`✅ Admin user created: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
    }

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
