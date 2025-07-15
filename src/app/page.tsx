"use client";
import React from "react";
// @ts-ignore
import Papa from "papaparse";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";

const CSV_FILE = "/08_康生通り1_full.csv";

const ageOptions = [
  { label: "全年齢", value: "allgender_allage" },
  { label: "0代", value: "allgender_0" },
  { label: "20代", value: "allgender_20" },
  { label: "30代", value: "allgender_30" },
  { label: "40代", value: "allgender_40" },
  { label: "50代", value: "allgender_50" },
  { label: "60代", value: "allgender_60" },
  { label: "70代", value: "allgender_70" },
  { label: "80代", value: "allgender_80" },
];

const weatherOptions = [
  { label: "すべて", value: "all" },
  { label: "晴れ", value: "sunny" },
  { label: "雨", value: "rain" },
  { label: "曇り", value: "cloudy" },
];

function getWeatherType(row: any) {
  const rain = parseFloat(row["rainfall"]);
  const sun = parseFloat(row["sunshine"]);
  if (rain > 0) return "rain";
  if (sun > 3) return "sunny";
  return "cloudy";
}

function getWeekday(dateStr: string) {
  const week = ["日","月","火","水","木","金","土"];
  const d = new Date(dateStr.replace(/\//g, "-"));
  return week[d.getDay()];
}

const weekdayOptions = [
  { label: "すべて", value: "all" },
  { label: "日", value: "日" },
  { label: "月", value: "月" },
  { label: "火", value: "火" },
  { label: "水", value: "水" },
  { label: "木", value: "木" },
  { label: "金", value: "金" },
  { label: "土", value: "土" },
];

export default function Home() {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  // フィルタ状態
  const [age, setAge] = React.useState("allgender_allage");
  const [weather, setWeather] = React.useState("all");
  const [weekday, setWeekday] = React.useState("all");

  React.useEffect(() => {
    fetch(CSV_FILE)
      .then((res) => {
        if (!res.ok) throw new Error("CSVの取得に失敗しました");
        return res.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setData(results.data as any[]);
            setLoading(false);
          },
        });
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // フィルタ適用
  const filtered = data.filter((row) => {
    if (!row[age]) return false;
    if (weather !== "all" && getWeatherType(row) !== weather) return false;
    if (weekday !== "all" && getWeekday(row.date) !== weekday) return false;
    return true;
  });

  // イベントあり・なしでグループ分け
  const eventRows = filtered.filter(row => row.events);
  const noneRows = filtered.filter(row => !row.events);

  // 平均人流
  const avgEvent = eventRows.reduce((sum, row) => sum + (parseInt(row[age]) || 0), 0) / (eventRows.length || 1);
  const avgNone = noneRows.reduce((sum, row) => sum + (parseInt(row[age]) || 0), 0) / (noneRows.length || 1);
  const diff = avgEvent - avgNone;

  // グラフ用データ
  const chartData = [
    {
      name: "イベントあり - なし",
      差分: Math.round(diff),
      イベントあり: Math.round(avgEvent),
      イベントなし: Math.round(avgNone),
    },
  ];

  return (
    <div className="p-8 text-black max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">人流データダッシュボード</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm mb-1">年齢層</label>
          <select value={age} onChange={e => setAge(e.target.value)} className="border rounded-xl px-2 py-1">
            {ageOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">天気</label>
          <select value={weather} onChange={e => setWeather(e.target.value)} className="border rounded-xl px-2 py-1">
            {weatherOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">曜日</label>
          <select value={weekday} onChange={e => setWeekday(e.target.value)} className="border rounded-xl px-2 py-1">
            {weekdayOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      {loading && <div>読み込み中...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && (
        <div className="bg-gray-100 rounded-4xl shadow-lg p-4">
          <h2 className="text-lg font-semibold mb-2">イベントありとなしの人流差分（{ageOptions.find(a=>a.value===age)?.label}）</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="差分" fill="red" name="イベントあり-なしの差分" />
              <Bar dataKey="イベントあり" fill="gray" name="イベントあり" />
              <Bar dataKey="イベントなし" fill="gray" name="イベントなし" />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-xs text-gray-500 mt-2">※フィルタ条件に合致する日数ごとの平均値</div>
        </div>
      )}
    </div>
  );
} 