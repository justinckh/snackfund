import mongoose from "mongoose";

// Cache connection across hot-reloads in dev
const cached = global as typeof global & {
  mongooseConn?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

if (!cached.mongooseConn) {
  cached.mongooseConn = { conn: null, promise: null };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error("MONGODB_URI environment variable is not set");

  if (cached.mongooseConn!.conn) return cached.mongooseConn!.conn;

  if (!cached.mongooseConn!.promise) {
    cached.mongooseConn!.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
  }

  cached.mongooseConn!.conn = await cached.mongooseConn!.promise;
  return cached.mongooseConn!.conn;
}
