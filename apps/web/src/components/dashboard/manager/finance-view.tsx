"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MoreHorizontal,
  ChevronRight,
  Search,
  Bell,
  MessageSquare,
} from "lucide-react";
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
import { useTranslations } from "next-intl";

// Mock Data
const financeData = [
  { name: "Jan", value1: 0.6, value2: 0.4 },
  { name: "Feb", value1: 0.8, value2: 0.5 },
  { name: "Mar", value1: 1.0, value2: 0.7 },
  { name: "Apr", value1: 1.2, value2: 0.9 },
  { name: "May", value1: 1.1, value2: 0.8 },
  { name: "Jun", value1: 1.4, value2: 1.0 },
  { name: "Jul", value1: 1.8, value2: 1.3 },
];

const pieData = [
  { name: "Group A", value: 400 },
  { name: "Group B", value: 300 },
  { name: "Group C", value: 300 },
];
const COLORS = ["#3b82f6", "#93c5fd", "#f59e0b"];

const teachers = [
  {
    id: 1,
    name: "Jank Viémav",
    role: "Da lrer 11",
    students: 2135,
    rating: 2240,
    progress: 75,
    image: "https://i.pravatar.cc/150?u=1",
  },
  {
    id: 2,
    name: "Dabk Garance",
    role: "Da ver 21",
    students: 7115,
    rating: 2023,
    progress: 60,
    image: "https://i.pravatar.cc/150?u=2",
  },
  {
    id: 3,
    name: "Jath Braurt",
    role: "Da ker 11",
    students: 2115,
    rating: 2605,
    progress: 45,
    image: "https://i.pravatar.cc/150?u=3",
  },
  {
    id: 4,
    name: "Warron Boad",
    role: "Da ver 21",
    students: 4119,
    rating: 2024,
    progress: 80,
    image: "https://i.pravatar.cc/150?u=4",
  },
];

const students = [
  {
    id: 1,
    name: "Jain Inape",
    classes: "50%",
    comment: "10%",
    points: "yellow",
  },
  {
    id: 2,
    name: "Jain Day",
    classes: "70%",
    comment: "10%",
    points: "green",
  },
  {
    id: 3,
    name: "Tway Drapts",
    classes: "90%",
    comment: "10%",
    points: "yellow",
  },
];

const customerService = [
  {
    id: 1,
    name: "Lost Creent",
    status: "online",
    image: "https://i.pravatar.cc/150?u=5",
  },
  {
    id: 2,
    name: "USS OSXword",
    status: "offline",
    image: "https://i.pravatar.cc/150?u=6",
  },
  {
    id: 3,
    name: "Lost Civent",
    status: "busy",
    image: "https://i.pravatar.cc/150?u=7",
    action: "Bant manage",
  },
];

export default function FinanceView() {
  const t = useTranslations("Dashboard");

  return (
    <div className="space-y-6">
      {/* Header Section (Mocking the top bar in the image) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">M.Deparments</h2>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-1 lg:col-span-5 space-y-6">
          {/* Finance Card */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Finance</CardTitle>
              <CardDescription>1d ko</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financeData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value1"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#3b82f6",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value2"
                      stroke="#93c5fd"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="relative h-32 w-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-blue-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Creat Qnfee Mfirtmation
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-8">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-sm text-muted-foreground">
                          GBR
                        </span>
                      </div>
                      <span className="text-lg font-bold">$21560</span>
                    </div>
                    <div className="flex items-center justify-between gap-8">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-sm text-muted-foreground">
                          GBR
                        </span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        $16.560
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="pl-0 text-xs uppercase text-muted-foreground font-semibold">
                      Uiddge
                    </TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground font-semibold">
                      Plasses
                    </TableHead>
                    <TableHead className="text-xs uppercase text-muted-foreground font-semibold">
                      Commanent
                    </TableHead>
                    <TableHead className="text-right text-xs uppercase text-muted-foreground font-semibold">
                      Dilponts
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow
                      key={student.id}
                      className="hover:bg-transparent border-none"
                    >
                      <TableCell className="pl-0 font-medium py-4">
                        {student.name}
                      </TableCell>
                      <TableCell className="py-4">{student.classes}</TableCell>
                      <TableCell className="py-4">{student.comment}</TableCell>
                      <TableCell className="text-right py-4">
                        <div
                          className={`inline-block h-3 w-3 rounded-full ${
                            student.points === "yellow"
                              ? "bg-amber-400"
                              : "bg-green-400"
                          }`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="col-span-1 lg:col-span-7 space-y-6">
          {/* Teachers Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Teachers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachers.map((teacher) => (
                <Card
                  key={teacher.id}
                  className="border-none shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                          <AvatarImage src={teacher.image} />
                          <AvatarFallback>
                            {teacher.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-bold text-sm">{teacher.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {teacher.role}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">
                          Sarrure NUL TMIL
                        </span>
                        <span className="font-bold text-blue-500">
                          {teacher.students}
                        </span>
                      </div>
                      <Progress
                        value={teacher.progress}
                        className="h-2 bg-blue-100"
                        indicatorClassName="bg-blue-500"
                      />
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="font-bold">{teacher.rating}</span>
                        <span className="text-blue-400 font-medium">7 115</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Customer Service Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{t("customerService")}</h3>
            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {customerService.map((cs) => (
                    <div
                      key={cs.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={cs.image} />
                          <AvatarFallback>{cs.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{cs.name}</span>
                      </div>

                      <div className="flex items-center gap-4">
                        {cs.action && (
                          <span className="text-xs text-muted-foreground hidden sm:inline-block">
                            {cs.action}
                          </span>
                        )}
                        <div className="w-32 hidden sm:block">
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-200 w-2/3 rounded-full" />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div
                          className={`h-3 w-3 rounded-full ${
                            cs.status === "online"
                              ? "bg-green-400"
                              : cs.status === "offline"
                              ? "bg-slate-300"
                              : "bg-amber-400"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
