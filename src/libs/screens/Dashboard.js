import React from "react";
import {
  FaTruck,
  FaRoad,
  FaWrench,
  FaChartLine,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Box, Typography } from "@mui/material";

const Dashboard = () => {
  const vehicleStats = [
    { name: "Total Vehicles", value: 42, icon: <FaTruck />, color: "#2c3e50" },
    { name: "Active Vehicles", value: 36, icon: <FaRoad />, color: "#27ae60" },
    { name: "Maintenance Due", value: 6, icon: <FaWrench />, color: "#e74c3c" },
    {
      name: "Available Vehicles",
      value: 12,
      icon: <FaTruck />,
      color: "#3498db",
    },
  ];

  const utilizationData = [
    { day: "Mon", utilization: 75 },
    { day: "Tue", utilization: 82 },
    { day: "Wed", utilization: 78 },
    { day: "Thu", utilization: 85 },
    { day: "Fri", utilization: 90 },
    { day: "Sat", utilization: 60 },
    { day: "Sun", utilization: 45 },
  ];

  const vehicleStatusData = [
    { name: "In Transit", value: 24, color: "#3498db" },
    { name: "Idle", value: 12, color: "#95a5a6" },
    { name: "Maintenance", value: 6, color: "#e74c3c" },
  ];

  return (
    <>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          fontFamily: "Raleway-Bold, sans-serif",
        }}
      >
        Fleet Overview <FaChartLine style={{ marginLeft: "10px" }} />
      </Typography>

      {/* Stats Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 3,
          marginBottom: "30px",
        }}
      >
        {vehicleStats.map((stat, index) => (
          <Box
            key={index}
            sx={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: 1,
              borderLeft: `4px solid ${stat.color}`,
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <Box
              sx={{
                backgroundColor: `${stat.color}20`,
                color: stat.color,
                borderRadius: "50%",
                width: "50px",
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              {stat.icon}
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "#7f8c8d",
                  fontFamily: "Raleway-Bold, sans-serif",
                }}
              >
                {stat.name}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {stat.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Charts */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
          marginBottom: "30px",
        }}
      >
        {/* Utilization Chart */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, fontFamily: "Raleway, sans-serif" }}
          >
            Weekly Utilization Rate (%)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={utilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="utilization"
                stroke="#3498db"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Vehicle Status Pie Chart */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, fontFamily: "Raleway, sans-serif" }}
          >
            Vehicle Status Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vehicleStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {vehicleStatusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} vehicles`, "Count"]} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Recent Activity */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        <Box
          sx={{
            flex: 1,
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, fontFamily: "Raleway, sans-serif" }}
          >
            Recent Trips
          </Typography>
          <Box
            component="ul"
            sx={{
              listStyle: "none",
              padding: 0,
              "& li": {
                padding: "10px 0",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              },
              "& li:before": {
                content: '"➔"',
                color: "#3498db",
              },
            }}
          >
            <li>Vehicle #TRK-1254 completed delivery to Warehouse 3</li>
            <li>Vehicle #TRK-0987 started new route to Miami</li>
            <li>Vehicle #TRK-3445 delayed due to weather conditions</li>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, fontFamily: "Raleway, sans-serif" }}
          >
            Upcoming Maintenance
          </Typography>
          <Box
            component="ul"
            sx={{
              listStyle: "none",
              padding: 0,
              "& li": {
                padding: "10px 0",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              },
              "& li:before": {
                content: '"⚠️"',
              },
            }}
          >
            <li>#TRK-2376 - Oil Change (Due: 03/15)</li>
            <li>#TRK-1298 - Tire Rotation (Due: 03/18)</li>
            <li>#TRK-4453 - Brake Inspection (Due: 03/20)</li>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
