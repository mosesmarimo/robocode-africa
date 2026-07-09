import { Injectable } from "@nestjs/common";
import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = { uid: string; role: string; tid: string; tv: number };

const ISSUER = "robocode.africa";

function loadSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    // Fail fast — never sign/verify sessions with a guessable key.
    throw new Error(
      "AUTH_SECRET is missing or too short (need >= 32 chars). Set a strong AUTH_SECRET in the environment.",
    );
  }
  return new TextEncoder().encode(secret);
}

@Injectable()
export class JwtService {
  private readonly secret = loadSecret();

  async sign(payload: SessionPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer(ISSUER)
      .setAudience(ISSUER)
      .setExpirationTime("7d")
      .sign(this.secret);
  }

  async verify(token: string): Promise<SessionPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret, { issuer: ISSUER, audience: ISSUER });
      return payload as unknown as SessionPayload;
    } catch {
      return null;
    }
  }
}
