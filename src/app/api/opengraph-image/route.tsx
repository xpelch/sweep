import Image from "next/image";
import { ImageResponse } from "next/og";

export const dynamic = 'force-dynamic';

export async function GET() {

  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col justify-center items-center relative bg-purple-600">
        <Image src={"static/og-preview.png"} tw="w-full h-full object-cover" alt="Sweep" />
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}