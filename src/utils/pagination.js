/** Offset/limit untuk Prisma; `page` dimulai dari 1. */
export const hitungOffset = ({ page, limit }) => ({ skip: (page - 1) * limit, take: limit });

/** Bentuk `meta` response list. `total` dinormalkan karena COUNT dari raw query berupa BigInt. */
export const buatMeta = ({ page, limit, total }) => ({ page, limit, total: Number(total) });
