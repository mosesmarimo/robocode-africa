import { Injectable } from "@nestjs/common";
import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = { uid: string; role: string; tid: string };

@Injectable()
export class JwtService {
  private readonly secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret");

  async sign(payload: SessionPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(this.secret);
  }

  async verify(token: string): Promise<SessionPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      return payload as unknown as SessionPayload;
    } catch {
      return null;
    }
  }
}
