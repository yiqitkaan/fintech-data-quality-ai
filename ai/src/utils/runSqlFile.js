const fs = require("fs");
// 	fs.readFileSync(...) → “dosyayı oku, bitmeden devam etme”
const path = require("path");

async function runSqlFile(pool, relativePath) {
  try {
    const absolutePath = path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      relativePath,
    );
    const sql = fs.readFileSync(absolutePath, "utf8");
    const res = await pool.query(sql);
    return res.rows;
  } catch (err) {
    console.error("runSqlFile failed:", err.message);
    throw err;
  }
}

module.exports = { runSqlFile };

/*
  runSqlFile.js — NEDEN VAR, NE YAPIYOR?

  Bu dosya “SQL dosyalarını Node tarafında çalıştırmak” için yazıldı.
  Çünkü:
  - SQL dosyaları sadece “kural / sorgu tanımıdır” (statik metin).
  - Uygulama (Node) ise “ne zaman, hangi sırayla, hangi output ile” çalıştıracağını kontrol eder.
  - İleride aynı SQL dosyalarını AI raporu üretmek, frontend endpoint’leri beslemek veya cron job gibi işler için kullanacağız.

  Temel akış:
  1) relativePath: Repo kökünden itibaren SQL dosyasının yolu.
     Örn: "db/ai_inputs/latest_run_summary.sql"
     Bu yol “relative”dır çünkü işletim sistemindeki tam adresi değil, proje içindeki konumu söyler.

  2) absolutePath: İşletim sistemindeki tam dosya adresi.
     Node script’i farklı klasörlerden çalıştırılabilir (npm scripts, farklı working dir vs).
     Bu yüzden dosyayı güvenli bulmak için relative path’i absolute path’e çeviriyoruz:

        path.resolve(__dirname, '..', '..', relativePath)

     __dirname = bu dosyanın bulunduğu klasör (ai/src/utils).
     '..', '..', '..' = üç klasör yukarı çık (repo root).
     sonra relativePath'i ekle (db/...).

  3) SQL dosyasını okuma:
        fs.readFileSync(absolutePath, 'utf8')
     - Sync okuyoruz çünkü bu aşamada basit, adım adım öğrenmek istiyoruz.
     - 'utf8' vermezsek text yerine buffer gelebilir.

  4) DB çalıştırma:
        await pool.query(sql)
     - pool = pg (PostgreSQL) connection pool.
       Her sorgu için yeni bağlantı açmak pahalı olduğu için pool bağlantıları hazır tutar.
     - await = sorgu bitene kadar bekle, sonuç gelince devam et.

  5) Fonksiyonun “utility” olması:
     - Bu fonksiyon sadece işi yapıp sonucu döndürür: res.rows
     - pool.end() burada YOK.
       Çünkü pool’u kapatma kararı “en üst seviye script”in işidir.
       (Örn. fetchLatestRunFromFiles.js tüm sorguları çalıştırır, en sonda pool.end() yapar.)

  6) Hata yönetimi:
     - try/catch içinde hatayı logluyoruz ama process.exit(1) yapmıyoruz.
       Çünkü programı kapatma kararı yine “üst seviye”nin işidir.
     - throw err; ile hatayı yukarı fırlatıyoruz ki çağıran yer isterse:
       - kullanıcıya mesaj basar
       - retry yapar
       - rapora “failed” yazar vb.

  7) module.exports neden?
     Projemiz şu an CommonJS kullanıyor (package.json'da "type":"module" yok).
     Bu yüzden export/import:
       module.exports = { runSqlFile }
       const { runSqlFile } = require('./runSqlFile')
*/
