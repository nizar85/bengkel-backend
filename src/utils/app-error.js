export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static tidakTerautentikasi() {
    return new AppError(401, 'TIDAK_TERAUTENTIKASI', 'Silakan login terlebih dahulu');
  }
  static aksesDitolak() {
    return new AppError(403, 'AKSES_DITOLAK', 'Anda tidak punya akses untuk aksi ini');
  }
  static tidakDitemukan(entitas) {
    return new AppError(404, 'TIDAK_DITEMUKAN', `${entitas} tidak ditemukan`);
  }
  static konflik(code, message, details) {
    return new AppError(409, code, message, details);
  }
}
