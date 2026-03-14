export const toolDeclarations = [
  {
    name: "get_crypto_price",
    description:
      "Mengambil harga cryptocurrency secara real-time dari CoinGecko. " +
      "Gunakan tool ini saat user bertanya tentang harga crypto seperti Bitcoin, Ethereum, dll.",
    parameters: {
      type: "object",
      properties: {
        coin_id: {
          type: "string",
          description:
            "ID coin di CoinGecko. Contoh: 'bitcoin', 'ethereum', 'binancecoin', 'solana'",
        },
        currency: {
          type: "string",
          description: "Mata uang target. Default: 'idr'. Contoh: 'idr', 'usd'",
        },
      },
      required: ["coin_id"],
    },
  },
  {
    name: "get_exchange_rate",
    description:
      "Mengambil kurs mata uang secara real-time. " +
      "Gunakan saat user bertanya tentang nilai tukar seperti USD ke IDR.",
    parameters: {
      type: "object",
      properties: {
        from_currency: {
          type: "string",
          description: "Kode mata uang asal. Contoh: 'USD', 'EUR', 'SGD'",
        },
        to_currency: {
          type: "string",
          description: "Kode mata uang tujuan. Contoh: 'IDR', 'USD'",
        },
        amount: {
          type: "number",
          description: "Jumlah yang ingin dikonversi. Default: 1",
        },
      },
      required: ["from_currency", "to_currency"],
    },
  },
  {
    name: "calculate_finance",
    description:
      "Melakukan perhitungan finansial seperti bunga majemuk, ROI, DCA, dan cicilan. " +
      "Gunakan saat user ingin menghitung proyeksi tabungan, investasi, atau pinjaman.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["compound_interest", "roi", "dca", "loan_installment"],
          description: "Jenis perhitungan yang diminta",
        },
        principal: {
          type: "number",
          description: "Modal awal atau jumlah pokok (dalam Rupiah)",
        },
        rate: {
          type: "number",
          description: "Tingkat bunga atau return per tahun (dalam persen). Contoh: 5 untuk 5%",
        },
        period_months: {
          type: "number",
          description: "Periode waktu dalam bulan",
        },
        monthly_addition: {
          type: "number",
          description: "Tambahan bulanan untuk DCA atau cicilan (opsional)",
        },
      },
      required: ["type", "principal", "rate", "period_months"],
    },
  },
  {
    name: "get_market_news",
    description:
      "Mengambil berita pasar keuangan dan ekonomi terbaru. " +
      "Gunakan saat user bertanya tentang berita atau kondisi pasar terkini.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "Topik berita yang dicari. Contoh: 'bitcoin', 'saham indonesia', 'rupiah', 'inflasi'",
        },
        limit: {
          type: "number",
          description: "Jumlah berita yang ditampilkan. Default: 3, maksimal: 5",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "track_portfolio",
    description:
      "Menghitung nilai total portofolio berdasarkan aset yang dimiliki user. " +
      "Gunakan saat user ingin mengetahui nilai portofolio atau keuntungan/kerugian aset mereka.",
    parameters: {
      type: "object",
      properties: {
        assets: {
          type: "array",
          description: "Daftar aset yang dimiliki user",
          items: {
            type: "object",
            properties: {
              coin_id: { type: "string", description: "ID coin di CoinGecko" },
              amount: { type: "number", description: "Jumlah koin yang dimiliki" },
              buy_price_idr: {
                type: "number",
                description: "Harga beli per koin dalam IDR",
              },
            },
            required: ["coin_id", "amount"],
          },
        },
      },
      required: ["assets"],
    },
  },
  {
    name: "get_financial_advice",
    description:
      "Memberikan edukasi dan saran finansial berdasarkan profil dan pertanyaan user. " +
      "Gunakan untuk pertanyaan tentang strategi investasi, manajemen risiko, atau perencanaan keuangan.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "Topik edukasi finansial. Contoh: 'diversifikasi', 'dollar cost averaging', 'reksa dana', 'emergency fund'",
        },
        risk_profile: {
          type: "string",
          enum: ["konservatif", "moderat", "agresif"],
          description: "Profil risiko user (opsional)",
        },
      },
      required: ["topic"],
    },
  },
];

export async function handleToolCall(toolName, args, memory) {
  switch (toolName) {
    case "get_crypto_price":
      return await getCryptoPrice(args.coin_id, args.currency || "idr");

    case "get_exchange_rate":
      return await getExchangeRate(args.from_currency, args.to_currency, args.amount || 1);

    case "calculate_finance":
      return calculateFinance(args);

    case "get_market_news":
      return await getMarketNews(args.topic, args.limit || 3);

    case "track_portfolio":
      return await trackPortfolio(args.assets);

    case "get_financial_advice":
      return getFinancialAdvice(args.topic, args.risk_profile);

    default:
      return { error: `Tool '${toolName}' tidak ditemukan.` };
  }
}

async function getCryptoPrice(coinId, currency) {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal fetch CoinGecko");
    const data = await res.json();

    if (!data[coinId]) {
      return { error: `Coin '${coinId}' tidak ditemukan. Coba gunakan: bitcoin, ethereum, solana` };
    }

    const price = data[coinId][currency];
    const change24h = data[coinId][`${currency}_24h_change`];
    const marketCap = data[coinId][`${currency}_market_cap`];

    return {
      coin: coinId,
      currency: currency.toUpperCase(),
      price: price,
      price_formatted: formatCurrency(price, currency),
      change_24h_percent: change24h?.toFixed(2),
      market_cap: formatCurrency(marketCap, currency),
      timestamp: new Date().toLocaleString("id-ID"),
    };
  } catch (err) {
    return { error: `Gagal mengambil harga ${coinId}: ${err.message}` };
  }
}

async function getExchangeRate(from, to, amount) {
  try {
    const url = `https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal fetch exchange rate");
    const data = await res.json();

    const rate = data.rates[to.toUpperCase()];
    if (!rate) {
      return { error: `Mata uang '${to}' tidak ditemukan.` };
    }

    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate: rate,
      amount: amount,
      result: (rate * amount).toLocaleString("id-ID"),
      result_formatted: `${amount} ${from.toUpperCase()} = ${(rate * amount).toLocaleString("id-ID")} ${to.toUpperCase()}`,
      timestamp: new Date().toLocaleString("id-ID"),
    };
  } catch (err) {
    return { error: `Gagal mengambil kurs: ${err.message}` };
  }
}

function calculateFinance({ type, principal, rate, period_months, monthly_addition = 0 }) {
  const monthlyRate = rate / 100 / 12;
  let result = {};

  switch (type) {
    case "compound_interest": {
      let total = principal * Math.pow(1 + monthlyRate, period_months);
      if (monthly_addition > 0) {
        total += monthly_addition * ((Math.pow(1 + monthlyRate, period_months) - 1) / monthlyRate);
      }
      result = {
        type: "Bunga Majemuk",
        modal_awal: formatRupiah(principal),
        tambahan_bulanan: formatRupiah(monthly_addition),
        total_akhir: formatRupiah(Math.round(total)),
        keuntungan: formatRupiah(Math.round(total - principal - monthly_addition * period_months)),
        periode: `${period_months} bulan (${(period_months / 12).toFixed(1)} tahun)`,
        bunga_tahunan: `${rate}%`,
      };
      break;
    }
    case "roi": {
      const profit = principal * (rate / 100) * (period_months / 12);
      result = {
        type: "ROI (Return on Investment)",
        modal: formatRupiah(principal),
        periode: `${period_months} bulan`,
        return_tahunan: `${rate}%`,
        estimasi_keuntungan: formatRupiah(Math.round(profit)),
        total_nilai: formatRupiah(Math.round(principal + profit)),
      };
      break;
    }
    case "dca": {
      const totalInvested = monthly_addition * period_months;
      const finalValue =
        monthly_addition * ((Math.pow(1 + monthlyRate, period_months) - 1) / monthlyRate);
      result = {
        type: "Dollar Cost Averaging (DCA)",
        investasi_per_bulan: formatRupiah(monthly_addition),
        total_diinvestasikan: formatRupiah(totalInvested),
        estimasi_nilai_akhir: formatRupiah(Math.round(finalValue)),
        estimasi_keuntungan: formatRupiah(Math.round(finalValue - totalInvested)),
        periode: `${period_months} bulan`,
        asumsi_return: `${rate}% per tahun`,
      };
      break;
    }
    case "loan_installment": {
      const installment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, period_months)) /
        (Math.pow(1 + monthlyRate, period_months) - 1);
      result = {
        type: "Cicilan Pinjaman",
        pokok_pinjaman: formatRupiah(principal),
        bunga_per_tahun: `${rate}%`,
        tenor: `${period_months} bulan`,
        cicilan_per_bulan: formatRupiah(Math.round(installment)),
        total_pembayaran: formatRupiah(Math.round(installment * period_months)),
        total_bunga: formatRupiah(Math.round(installment * period_months - principal)),
      };
      break;
    }
  }

  return result;
}

async function getMarketNews(topic, limit) {
  try {
    const newsApiKey = process.env.NEWS_API_KEY;

    if (!newsApiKey || newsApiKey === "your_news_api_key_here") {
      return {
        source: "Simulasi (tambahkan NEWS_API_KEY untuk berita real)",
        topic,
        news: [
          {
            title: `Pasar ${topic} menunjukkan volatilitas tinggi pekan ini`,
            summary: "Analis memperkirakan pergerakan harga yang signifikan dalam waktu dekat.",
            published_at: new Date().toLocaleDateString("id-ID"),
          },
          {
            title: `Investor institusional mulai melirik ${topic}`,
            summary: "Laporan terbaru menunjukkan peningkatan minat dari investor besar.",
            published_at: new Date().toLocaleDateString("id-ID"),
          },
          {
            title: `Regulasi baru ${topic} sedang dibahas pemerintah`,
            summary: "Kebijakan baru diharapkan memberikan kepastian hukum bagi investor.",
            published_at: new Date().toLocaleDateString("id-ID"),
          },
        ].slice(0, limit),
      };
    }

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=id&sortBy=publishedAt&pageSize=${limit}&apiKey=${newsApiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "ok") throw new Error(data.message);

    return {
      topic,
      total_results: data.totalResults,
      news: data.articles.slice(0, limit).map((a) => ({
        title: a.title,
        source: a.source.name,
        summary: a.description,
        url: a.url,
        published_at: new Date(a.publishedAt).toLocaleDateString("id-ID"),
      })),
    };
  } catch (err) {
    return { error: `Gagal mengambil berita: ${err.message}` };
  }
}

async function trackPortfolio(assets) {
  try {
    const coinIds = assets.map((a) => a.coin_id).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=idr&include_24hr_change=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal fetch harga untuk portfolio");
    const prices = await res.json();

    let totalCurrentValue = 0;
    let totalBuyValue = 0;

    const breakdown = assets.map((asset) => {
      const currentPrice = prices[asset.coin_id]?.idr || 0;
      const currentValue = currentPrice * asset.amount;
      const buyValue = (asset.buy_price_idr || currentPrice) * asset.amount;
      const pnl = currentValue - buyValue;
      const pnlPercent = buyValue > 0 ? ((pnl / buyValue) * 100).toFixed(2) : "N/A";

      totalCurrentValue += currentValue;
      totalBuyValue += buyValue;

      return {
        coin: asset.coin_id,
        jumlah: asset.amount,
        harga_saat_ini: formatRupiah(currentPrice),
        nilai_saat_ini: formatRupiah(Math.round(currentValue)),
        nilai_beli: asset.buy_price_idr ? formatRupiah(Math.round(buyValue)) : "Tidak diketahui",
        pnl: asset.buy_price_idr
          ? `${pnl >= 0 ? "+" : ""}${formatRupiah(Math.round(pnl))} (${pnlPercent}%)`
          : "N/A",
        change_24h: `${prices[asset.coin_id]?.idr_24h_change?.toFixed(2) || 0}%`,
      };
    });

    const totalPnl = totalCurrentValue - totalBuyValue;

    return {
      ringkasan: {
        total_nilai_portfolio: formatRupiah(Math.round(totalCurrentValue)),
        total_modal: formatRupiah(Math.round(totalBuyValue)),
        total_pnl: `${totalPnl >= 0 ? "+" : ""}${formatRupiah(Math.round(totalPnl))}`,
        pnl_persen: `${((totalPnl / totalBuyValue) * 100).toFixed(2)}%`,
      },
      detail_aset: breakdown,
      last_updated: new Date().toLocaleString("id-ID"),
    };
  } catch (err) {
    return { error: `Gagal menghitung portfolio: ${err.message}` };
  }
}

function getFinancialAdvice(topic, riskProfile) {
  const adviceDatabase = {
    diversifikasi: {
      penjelasan:
        "Diversifikasi adalah strategi menyebar investasi ke berbagai aset untuk mengurangi risiko.",
      prinsip: [
        "Jangan taruh semua telur dalam satu keranjang",
        "Campurkan aset berisiko rendah (deposito, obligasi) dan tinggi (saham, crypto)",
        "Rebalancing portofolio secara berkala (3-6 bulan sekali)",
      ],
      rekomendasi_alokasi: {
        konservatif: "70% deposito/obligasi, 25% saham, 5% crypto",
        moderat: "40% deposito/obligasi, 45% saham, 15% crypto",
        agresif: "10% deposito/obligasi, 50% saham, 40% crypto",
      },
    },
    "dollar cost averaging": {
      penjelasan:
        "DCA adalah strategi investasi rutin dalam jumlah tetap tanpa memandang harga pasar.",
      manfaat: [
        "Mengurangi dampak volatilitas harga",
        "Disiplin investasi jangka panjang",
        "Tidak perlu timing pasar yang tepat",
        "Cocok untuk pemula",
      ],
      contoh: "Investasi Rp500.000/bulan ke Bitcoin tanpa peduli harga naik atau turun",
    },
    "reksa dana": {
      penjelasan: "Reksa dana adalah wadah investasi yang dikelola manajer investasi profesional.",
      jenis: [
        "Reksa Dana Pasar Uang: risiko rendah, cocok untuk dana darurat",
        "Reksa Dana Pendapatan Tetap: risiko menengah, return lebih stabil",
        "Reksa Dana Campuran: risiko moderat, kombinasi saham dan obligasi",
        "Reksa Dana Saham: risiko tinggi, potensi return tertinggi",
      ],
      platform: ["Bibit", "Bareksa", "Ajaib", "Tokopedia Investasi"],
    },
    "emergency fund": {
      penjelasan: "Dana darurat adalah simpanan khusus untuk kondisi darurat tak terduga.",
      aturan: [
        "Single/tanpa tanggungan: 3-6x pengeluaran bulanan",
        "Menikah tanpa anak: 6-9x pengeluaran bulanan",
        "Menikah + anak: 9-12x pengeluaran bulanan",
      ],
      tips: [
        "Simpan di tempat likuid (deposito, tabungan, reksa dana pasar uang)",
        "Jangan diinvestasikan ke instrumen berisiko tinggi",
        "Pisahkan dari rekening utama agar tidak terpakai",
      ],
    },
  };

  const topicLower = topic.toLowerCase();
  const matched = Object.keys(adviceDatabase).find((key) => topicLower.includes(key));

  if (matched) {
    const advice = adviceDatabase[matched];
    if (riskProfile && advice.rekomendasi_alokasi) {
      advice.alokasi_untuk_kamu = advice.rekomendasi_alokasi[riskProfile];
    }
    return { topic: matched, profil_risiko: riskProfile || "tidak disebutkan", ...advice };
  }

  return {
    topic,
    pesan:
      "Topik ini belum ada dalam database edukasi. Namun secara umum, prinsip keuangan yang baik adalah: " +
      "miliki dana darurat, hindari hutang konsumtif, investasi secara rutin, dan diversifikasi portofolio.",
    disclaimer: "Ini adalah edukasi finansial, bukan saran investasi resmi.",
  };
}

// ── Helper functions ──
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

function formatCurrency(amount, currency) {
  if (currency === "idr") return formatRupiah(amount);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 2 }).format(amount);
}