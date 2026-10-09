-- CreateTable
CREATE TABLE `pengguna` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'kasir', 'mekanik') NOT NULL,
    `no_hp` VARCHAR(20) NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pengguna_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pelanggan` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `no_hp` VARCHAR(20) NOT NULL,
    `no_polisi` VARCHAR(15) NULL,
    `tipe_motor` VARCHAR(100) NULL,
    `terakhir_dihubungi_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pelanggan_no_hp_idx`(`no_hp`),
    INDEX `pelanggan_no_polisi_idx`(`no_polisi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barang` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `kategori` ENUM('mesin', 'kelistrikan', 'pengereman', 'transmisi_penggerak', 'ban_roda', 'suspensi', 'body_aksesoris', 'cairan_consumables') NOT NULL,
    `satuan` VARCHAR(20) NOT NULL DEFAULT 'pcs',
    `harga_beli_rata_rata` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `harga_jual` DECIMAL(12, 2) NOT NULL,
    `stok` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `stok_minimum` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `lokasi_rak` VARCHAR(50) NULL,
    `kompatibilitas_motor` VARCHAR(255) NULL,
    `tipe` ENUM('original', 'kw1', 'kw2', 'lainnya') NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `barang_nama_idx`(`nama`),
    INDEX `barang_kategori_idx`(`kategori`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jasa` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `harga` DECIMAL(12, 2) NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaksi_servis` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(20) NOT NULL,
    `pelanggan_id` BIGINT UNSIGNED NOT NULL,
    `dibuat_oleh_id` BIGINT UNSIGNED NOT NULL,
    `mekanik_id` BIGINT UNSIGNED NOT NULL,
    `keluhan` TEXT NULL,
    `subtotal_jasa` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `subtotal_barang` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `status_bayar` ENUM('belum_bayar', 'lunas') NOT NULL DEFAULT 'belum_bayar',
    `metode_bayar` ENUM('tunai', 'transfer', 'qris') NULL,
    `dibayar_at` DATETIME(3) NULL,
    `dibayar_oleh_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transaksi_servis_kode_key`(`kode`),
    INDEX `transaksi_servis_created_at_idx`(`created_at`),
    INDEX `transaksi_servis_mekanik_id_status_bayar_idx`(`mekanik_id`, `status_bayar`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_jasa` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `transaksi_servis_id` BIGINT UNSIGNED NOT NULL,
    `jasa_id` BIGINT UNSIGNED NOT NULL,
    `harga` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detail_barang` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `transaksi_servis_id` BIGINT UNSIGNED NOT NULL,
    `barang_id` BIGINT UNSIGNED NOT NULL,
    `qty` INTEGER UNSIGNED NOT NULL,
    `harga_jual` DECIMAL(12, 2) NOT NULL,
    `harga_beli` DECIMAL(12, 2) NOT NULL,
    `dicatat_oleh_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pembelian` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `barang_id` BIGINT UNSIGNED NOT NULL,
    `jumlah` INTEGER UNSIGNED NOT NULL,
    `total_harga` DECIMAL(12, 2) NOT NULL,
    `harga_per_pcs` DECIMAL(12, 2) NOT NULL,
    `tanggal` DATE NOT NULL,
    `keterangan` VARCHAR(255) NULL,
    `dibuat_oleh_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pembelian_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengeluaran` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `kategori` ENUM('listrik_air', 'sewa', 'gaji', 'peralatan', 'lainnya') NOT NULL,
    `keterangan` VARCHAR(255) NULL,
    `jumlah` DECIMAL(12, 2) NOT NULL,
    `tanggal` DATE NOT NULL,
    `dibuat_oleh_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `pengeluaran_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stok_log` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `barang_id` BIGINT UNSIGNED NOT NULL,
    `tipe` ENUM('masuk', 'keluar', 'penyesuaian') NOT NULL,
    `qty_perubahan` INTEGER NOT NULL,
    `stok_sesudah` INTEGER UNSIGNED NOT NULL,
    `transaksi_servis_id` BIGINT UNSIGNED NULL,
    `pembelian_id` BIGINT UNSIGNED NULL,
    `keterangan` VARCHAR(255) NULL,
    `pengguna_id` BIGINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stok_log_barang_id_created_at_idx`(`barang_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_aktivitas` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `pengguna_id` BIGINT UNSIGNED NOT NULL,
    `aksi` VARCHAR(50) NOT NULL,
    `entitas` VARCHAR(50) NOT NULL,
    `entitas_id` BIGINT UNSIGNED NULL,
    `keterangan` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `log_aktivitas_pengguna_id_created_at_idx`(`pengguna_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengaturan` (
    `kunci` VARCHAR(50) NOT NULL,
    `nilai` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`kunci`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transaksi_servis` ADD CONSTRAINT `transaksi_servis_pelanggan_id_fkey` FOREIGN KEY (`pelanggan_id`) REFERENCES `pelanggan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_servis` ADD CONSTRAINT `transaksi_servis_dibuat_oleh_id_fkey` FOREIGN KEY (`dibuat_oleh_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_servis` ADD CONSTRAINT `transaksi_servis_mekanik_id_fkey` FOREIGN KEY (`mekanik_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaksi_servis` ADD CONSTRAINT `transaksi_servis_dibayar_oleh_id_fkey` FOREIGN KEY (`dibayar_oleh_id`) REFERENCES `pengguna`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_jasa` ADD CONSTRAINT `detail_jasa_transaksi_servis_id_fkey` FOREIGN KEY (`transaksi_servis_id`) REFERENCES `transaksi_servis`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_jasa` ADD CONSTRAINT `detail_jasa_jasa_id_fkey` FOREIGN KEY (`jasa_id`) REFERENCES `jasa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_barang` ADD CONSTRAINT `detail_barang_transaksi_servis_id_fkey` FOREIGN KEY (`transaksi_servis_id`) REFERENCES `transaksi_servis`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_barang` ADD CONSTRAINT `detail_barang_barang_id_fkey` FOREIGN KEY (`barang_id`) REFERENCES `barang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detail_barang` ADD CONSTRAINT `detail_barang_dicatat_oleh_id_fkey` FOREIGN KEY (`dicatat_oleh_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembelian` ADD CONSTRAINT `pembelian_barang_id_fkey` FOREIGN KEY (`barang_id`) REFERENCES `barang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pembelian` ADD CONSTRAINT `pembelian_dibuat_oleh_id_fkey` FOREIGN KEY (`dibuat_oleh_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengeluaran` ADD CONSTRAINT `pengeluaran_dibuat_oleh_id_fkey` FOREIGN KEY (`dibuat_oleh_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_log` ADD CONSTRAINT `stok_log_barang_id_fkey` FOREIGN KEY (`barang_id`) REFERENCES `barang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_log` ADD CONSTRAINT `stok_log_transaksi_servis_id_fkey` FOREIGN KEY (`transaksi_servis_id`) REFERENCES `transaksi_servis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_log` ADD CONSTRAINT `stok_log_pembelian_id_fkey` FOREIGN KEY (`pembelian_id`) REFERENCES `pembelian`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_log` ADD CONSTRAINT `stok_log_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_aktivitas` ADD CONSTRAINT `log_aktivitas_pengguna_id_fkey` FOREIGN KEY (`pengguna_id`) REFERENCES `pengguna`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
