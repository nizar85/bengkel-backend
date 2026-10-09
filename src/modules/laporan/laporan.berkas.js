import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { jamMenitWIB, tanggalWIB } from '../../utils/waktu.js';
import {
  bangunModelBerkas,
  formatRupiah,
  formatTanggal,
  namaBerkas,
} from './laporan.berkas.calc.js';
import {
  toBarangTerlarisDTO,
  toLabaKasarDTO,
  toPemasukanDTO,
  toUangKeluarDTO,
} from './laporan.dto.js';
import * as service from './laporan.service.js';

const TIPE_BERKAS = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

const AMBIL_DTO = {
  pemasukan: async (query) => toPemasukanDTO(await service.pemasukan(query)),
  'uang-keluar': async (query) => toUangKeluarDTO(await service.uangKeluar(query)),
  'laba-kasar': async (query) => toLabaKasarDTO(await service.labaKasar(query)),
  'barang-terlaris': async (query) => toBarangTerlarisDTO(await service.barangTerlaris(query)),
};

const TANGGAL_ISO = /^\d{4}-\d{2}-\d{2}$/;
const formatAngka = new Intl.NumberFormat('id-ID');
const cetakPada = () => `${formatTanggal(tanggalWIB())} ${jamMenitWIB()} WIB`;
const periodeTeks = (model) =>
  `Periode: ${formatTanggal(model.dari)} s.d. ${formatTanggal(model.sampai)} (WIB)`;
const rataKanan = (kolom) => kolom.tipe === 'uang' || kolom.tipe === 'angka';

/**
 * Berkas laporan (FIN-8). Isinya data endpoint laporan yang sama: tidak ada query baru, hanya
 * bentuk tabel yang berbeda.
 */
export async function buatBerkas(query) {
  const dto = await AMBIL_DTO[query.jenis](query);
  const model = bangunModelBerkas(query.jenis, dto);
  const buffer = query.format === 'pdf' ? await renderPdf(model) : await renderXlsx(model);
  return {
    nama: namaBerkas(query.jenis, dto.dari, dto.sampai, query.format),
    tipe: TIPE_BERKAS[query.format],
    buffer,
  };
}

// Angka tetap disimpan sebagai angka (bukan teks) supaya bisa dijumlah di Excel
const nilaiXlsx = (kolom, nilai) =>
  kolom.tipe === 'tanggal' && TANGGAL_ISO.test(nilai) ? formatTanggal(nilai) : nilai;

export async function renderXlsx(model) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(model.judul.slice(0, 31)); // batas nama sheet Excel: 31 karakter

  sheet.addRow([model.judul]).font = { bold: true, size: 14 };
  sheet.addRow([periodeTeks(model)]);
  sheet.addRow([`Dicetak: ${cetakPada()}`]);
  sheet.addRow([]);

  const header = sheet.addRow(model.kolom.map((k) => k.judul));
  header.font = { bold: true };
  header.eachCell((sel) => {
    sel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    sel.border = { bottom: { style: 'thin' } };
  });

  const tambahBaris = (baris, tebal) => {
    const row = sheet.addRow(model.kolom.map((k) => nilaiXlsx(k, baris[k.kunci])));
    model.kolom.forEach((kolom, i) => {
      const sel = row.getCell(i + 1);
      if (kolom.tipe === 'uang') sel.numFmt = '#,##0.00';
      if (kolom.tipe === 'angka') sel.numFmt = '#,##0';
      sel.alignment = { horizontal: rataKanan(kolom) ? 'right' : 'left' };
    });
    if (tebal) row.font = { bold: true };
  };

  model.baris.forEach((baris) => tambahBaris(baris, false));
  if (model.baris.length === 0) {
    sheet.addRow(['Tidak ada data pada periode ini']).font = { italic: true };
  }
  model.totalBaris.forEach((baris) => tambahBaris(baris, true));
  if (model.catatan.length > 0) {
    sheet.addRow([]);
    model.catatan.forEach((catatan) => {
      sheet.addRow([catatan]).font = { italic: true, size: 9 };
    });
  }

  model.kolom.forEach((kolom, i) => {
    sheet.getColumn(i + 1).width = kolom.tipe === 'teks' ? 48 : 20;
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

const teksPdf = (kolom, nilai) => {
  if (kolom.tipe === 'uang') return formatRupiah(nilai);
  if (kolom.tipe === 'angka') return formatAngka.format(nilai);
  if (kolom.tipe === 'tanggal' && TANGGAL_ISO.test(nilai)) return formatTanggal(nilai);
  return String(nilai ?? '');
};

export function renderPdf(model) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: model.judul } });
    const potongan = [];
    doc.on('data', (p) => potongan.push(p));
    doc.on('end', () => resolve(Buffer.concat(potongan)));
    doc.on('error', reject);

    const kiri = doc.page.margins.left;
    const lebarTabel = doc.page.width - kiri - doc.page.margins.right;
    // Lebar kolom sebanding dengan bobotnya (bawaan menurut tipe, bisa ditimpa `bobot` di kolom):
    // teks paling lebar, rupiah cukup lebar untuk nilai terbesar DECIMAL(12,2) ("Rp 9.999.999.999,99")
    const BOBOT_TIPE = { teks: 3, uang: 1.8, tanggal: 1.3, angka: 1.6 };
    const bobot = model.kolom.map((k) => k.bobot ?? BOBOT_TIPE[k.tipe]);
    const jumlahBobot = bobot.reduce((a, b) => a + b, 0);
    const lebarKolom = bobot.map((b) => (b / jumlahBobot) * lebarTabel);
    const TINGGI_BARIS = 22;
    const judulKolom = model.kolom.map((k) => k.judul);

    // `gabung`: satu sel selebar tabel, untuk pesan yang tidak boleh terpotong di kolom sempit
    const gambarBaris = (nilai, { tebal = false, latar = null, gabung = false } = {}) => {
      const y = doc.y;
      if (latar) doc.rect(kiri, y, lebarTabel, TINGGI_BARIS).fill(latar);
      doc
        .fillColor('#000000')
        .font(tebal ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9);
      if (gabung) {
        doc.text(nilai[0], kiri + 4, y + 6, { width: lebarTabel - 8, height: 12, ellipsis: true });
      } else {
        let x = kiri;
        nilai.forEach((teks, i) => {
          doc.text(teks, x + 4, y + 6, {
            width: lebarKolom[i] - 8,
            height: 12,
            ellipsis: true,
            align: rataKanan(model.kolom[i]) ? 'right' : 'left',
          });
          x += lebarKolom[i];
        });
      }
      doc
        .moveTo(kiri, y + TINGGI_BARIS)
        .lineTo(kiri + lebarTabel, y + TINGGI_BARIS)
        .lineWidth(0.5)
        .strokeColor('#CCCCCC')
        .stroke();
      doc.x = kiri;
      doc.y = y + TINGGI_BARIS;
    };

    const gambarHeader = () => gambarBaris(judulKolom, { tebal: true, latar: '#E5E7EB' });
    const barisBerikut = (nilai, gaya) => {
      if (doc.y + TINGGI_BARIS > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        gambarHeader();
      }
      gambarBaris(nilai, gaya);
    };
    const nilaiBaris = (baris) => model.kolom.map((k) => teksPdf(k, baris[k.kunci]));

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#000000').text(model.judul, kiri, doc.y);
    doc.font('Helvetica').fontSize(10).fillColor('#444444');
    doc.text(periodeTeks(model));
    doc.text(`Dicetak: ${cetakPada()}`);
    doc.moveDown();

    gambarHeader();
    model.baris.forEach((baris) => barisBerikut(nilaiBaris(baris)));
    if (model.baris.length === 0) {
      barisBerikut(['Tidak ada data pada periode ini'], { gabung: true });
    }
    model.totalBaris.forEach((baris) => barisBerikut(nilaiBaris(baris), { tebal: true }));

    if (model.catatan.length > 0) {
      doc.moveDown();
      doc.font('Helvetica-Oblique').fontSize(8).fillColor('#444444');
      model.catatan.forEach((catatan) => doc.text(catatan, kiri, doc.y, { width: lebarTabel }));
    }
    doc.end();
  });
}
