import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const day = (s: string) => new Date(`${s}T00:00:00.000Z`);

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (!email || password.length < 10) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (min 10 characters) before seeding.");
  }

  await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Administrator", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`Admin ready: ${email}`);

  if (process.env.SEED_DEMO !== "true") return;
  if ((await db.student.count()) > 0) {
    console.log("Demo data skipped: database already contains students.");
    return;
  }

  const [cs, it, ee, me] = await Promise.all(
    [
      ["Computer Science", "Dr. Rahman Khan"],
      ["Information Technology", "Dr. Nusrat Jahan"],
      ["Electronics", "Dr. Imran Hossain"],
      ["Mechanical Engineering", "Dr. Farhana Akter"],
    ].map(([name, head]) => db.department.create({ data: { name, head } })),
  );
  const course = (name: string, duration: string, fee: number, departmentId: string, capacity?: number) =>
    db.course.create({ data: { name, duration, fee, departmentId, capacity } });
  const bcs = await course("Bachelor of Computer Science", "4 Years", 50000, cs.id, 60);
  const mca = await course("Master of Computer Applications", "2 Years", 35000, cs.id, 30);
  const bit = await course("Bachelor of Information Technology", "4 Years", 45000, it.id, 50);
  await course("Diploma in Web Development", "1 Year", 25000, it.id);
  await course("Bachelor of Electronics", "4 Years", 40000, ee.id, 40);
  await course("Bachelor of Mechanical Engineering", "4 Years", 48000, me.id, 40);

  const student = (name: string, email: string, phone: string, address: string, dob: string) =>
    db.student.create({ data: { name, email, phone, address, dob: day(dob) } });
  const alice = await student("Ayesha Rahman", "ayesha.rahman@example.com", "+8801711000001", "House 12, Road 4, Dhanmondi, Dhaka", "2002-05-15");
  const bob = await student("Tanvir Ahmed", "tanvir.ahmed@example.com", "+8801711000002", "45 Station Road, Chattogram", "2001-12-10");
  const charlie = await student("Mitu Akter", "mitu.akter@example.com", "+8801711000003", "78 Zindabazar, Sylhet", "2003-03-22");
  await student("Rafiq Islam", "rafiq.islam@example.com", "+8801711000004", "22 Rajshahi Cantonment, Rajshahi", "2002-08-02");

  const admit = async (studentId: string, courseId: string, fee: number, date: string, paid: [number, string, "CASH" | "CARD" | "ONLINE" | "CHEQUE"][]) => {
    const a = await db.admission.create({ data: { studentId, courseId, fee, admissionDate: day(date) } });
    for (const [amount, paidOn, method] of paid) await db.payment.create({ data: { admissionId: a.id, amount, paidOn: day(paidOn), method } });
  };
  await admit(alice.id, bcs.id, 50000, "2025-06-01", [[50000, "2025-06-01", "ONLINE"]]);
  await admit(bob.id, mca.id, 35000, "2025-06-15", [[20000, "2025-06-15", "CARD"]]);
  await admit(charlie.id, bit.id, 45000, "2025-07-01", []);
  console.log("Demo data loaded.");
}

main().finally(() => db.$disconnect());
