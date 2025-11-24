import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import User from "@/app/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  console.log("API Route: /api/auth/signup called");
  try {
    console.log("API Route: Connecting to database...");
    await dbConnect();
    console.log("API Route: Database connected");

    const body = await req.json();
    console.log("API Route: Request body:", { ...body, password: "***" });

    const { firstName, lastName, email, phone, country, password } = body;

    // Basic validation
    if (!firstName || !lastName || !email || !phone || !country || !password) {
      console.log("API Route: Validation error - missing fields");
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log("API Route: Checking for existing user...");
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("API Route: User already exists");
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    console.log("API Route: Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    console.log("API Route: Creating user...");
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      country,
      password: hashedPassword,
    });
    console.log("API Route: User created successfully", user._id);

    return NextResponse.json(
      { message: "User created successfully", userId: user._id },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("API Route: Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + errorMessage },
      { status: 500 }
    );
  }
}
