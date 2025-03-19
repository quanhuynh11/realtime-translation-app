import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.resolve(process.cwd(), "public/uploads");

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const fileName = formData.get("newFilename");

        if (!file) {
            return new Response("No file uploaded", { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Ensure the upload directory exists
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true }); // Create the folder if it does not exist
        }

        const filePath = path.join(UPLOAD_DIR, fileName);
        fs.writeFileSync(filePath, buffer);

        return new Response(JSON.stringify({ message: "File uploaded", filePath }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
