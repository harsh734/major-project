import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const ChartDisplay = ({ data, xKey, yKey, title }) => (
    <div className="p-4 bg-white shadow rounded-2xl mt-4">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey={yKey} stroke="#3b82f6" />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

export default ChartDisplay;
