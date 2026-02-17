// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage, deleteImage } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "product", "stylist", "logo"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Determine upload folder
    let folder: string;
    switch (type) {
      case "product":
        folder = "products";
        break;
      case "stylist":
        folder = "stylists";
        break;
      case "logo":
        folder = "logos";
        break;
      case "gallery":
        folder = "gallery";
        break;
      default:
        return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const { url, publicId } = await uploadImage(buffer, folder);

    return NextResponse.json({
      success: true,
      url,
      publicId,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { publicId } = await request.json();

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }

    // Only allow deleting images within the salonixpro folder
    if (!publicId.startsWith("salonixpro/")) {
      return NextResponse.json({ error: "Invalid publicId" }, { status: 400 });
    }

    await deleteImage(publicId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
