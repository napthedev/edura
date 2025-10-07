"use client";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

const PERCENTAGE_MULTIPLIER = 100;

export default function Todos() {
  const t = useTranslations("Todos");
  const [todos, setTodos] = useState<Todo[]>([
    { id: "1", text: "Hoàn thành báo cáo tháng", completed: false },
    { id: "2", text: "Gặp gỡ khách hàng về dự án mới", completed: true },
    { id: "3", text: "Cập nhật tài liệu hướng dẫn", completed: false },
    { id: "4", text: "Tối ưu hóa hiệu suất ứng dụng", completed: false },
    { id: "5", text: "Kiểm tra và sửa lỗi giao diện", completed: true },
  ]);
  const [newTodo, setNewTodo] = useState("");

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: Todo = {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
      };
      setTodos([...todos, todo]);
      setNewTodo("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const completedCount = todos.filter((todo) => todo.completed).length;
  const pendingCount = todos.length - completedCount;
  const completionPercentage =
    todos.length > 0
      ? Math.round((completedCount / todos.length) * PERCENTAGE_MULTIPLIER)
      : 0;

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <h1 className="mb-2 font-bold text-3xl">{t("title")}</h1>
        <div className="flex gap-4 text-muted-foreground text-sm">
          <span>
            {t("pending")}: {pendingCount}
          </span>
          <span>
            {t("completed")}: {completedCount}
          </span>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("addTodo")}</CardTitle>
          <CardDescription>{t("addNewTask")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              className="flex-1"
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("enterNewTask")}
              value={newTodo}
            />
            <Button onClick={addTodo} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {todos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{t("noTodos")}</p>
            </CardContent>
          </Card>
        ) : (
          todos.map((todo) => (
            <Card className={todo.completed ? "opacity-60" : ""} key={todo.id}>
              <CardContent className="flex items-center gap-3 py-4">
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id)}
                />
                <span
                  className={`flex-1 ${todo.completed ? "line-through" : ""}`}
                >
                  {todo.text}
                </span>
                <Button
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteTodo(todo.id)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {todos.length > 0 && (
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex justify-between text-sm">
              <span>Tiến độ hoàn thành</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-green-500 transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
