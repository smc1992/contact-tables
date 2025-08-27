import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Chart.js Komponenten registrieren
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  userRegistrations: {
    labels: string[];
    data: number[];
  };
  restaurantRegistrations: {
    labels: string[];
    data: number[];
  };
  revenue: {
    labels: string[];
    data: number[];
  };
  userTypes: {
    labels: string[];
    data: number[];
  };
}

interface AnalyticsChartsProps {
  data: AnalyticsData;
  isLoading: boolean;
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ data, isLoading }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  // Chart-Optionen
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Benutzerregistrierungen',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monatliche Einnahmen',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Benutzerverteilung',
      },
    },
  };

  // Chart-Daten
  const userRegistrationsData = {
    labels: data.userRegistrations.labels,
    datasets: [
      {
        label: 'Neue Benutzer',
        data: data.userRegistrations.data,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const restaurantRegistrationsData = {
    labels: data.restaurantRegistrations.labels,
    datasets: [
      {
        label: 'Neue Restaurants',
        data: data.restaurantRegistrations.data,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const revenueData = {
    labels: data.revenue.labels,
    datasets: [
      {
        label: 'Einnahmen (€)',
        data: data.revenue.data,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      },
    ],
  };

  const userTypesData = {
    labels: data.userTypes.labels,
    datasets: [
      {
        label: 'Benutzertypen',
        data: data.userTypes.data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Analytik & Berichte</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeframe === 'week'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Woche
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeframe === 'month'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monat
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeframe === 'year'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Jahr
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <Line options={lineOptions} data={userRegistrationsData} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <Line options={{...lineOptions, plugins: {...lineOptions.plugins, title: {display: true, text: 'Restaurantregistrierungen'}}}} data={restaurantRegistrationsData} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <Bar options={barOptions} data={revenueData} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <Pie options={pieOptions} data={userTypesData} />
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Zusammenfassung</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">Neue Benutzer (letzte 30 Tage)</p>
            <p className="text-2xl font-bold text-gray-900">{data.userRegistrations.data.reduce((a, b) => a + b, 0)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">Neue Restaurants (letzte 30 Tage)</p>
            <p className="text-2xl font-bold text-gray-900">{data.restaurantRegistrations.data.reduce((a, b) => a + b, 0)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">Gesamteinnahmen (letzte 30 Tage)</p>
            <p className="text-2xl font-bold text-gray-900">{data.revenue.data.reduce((a, b) => a + b, 0).toLocaleString('de-DE')} €</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-500">Durchschnittliche Einnahmen pro Tag</p>
            <p className="text-2xl font-bold text-gray-900">
              {(data.revenue.data.reduce((a, b) => a + b, 0) / data.revenue.data.length).toFixed(2).replace('.', ',')} €
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
