import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { testService } from "../services/testService";
import { Test } from "../data/mockData";
import { Label } from "./ui/label";

interface TestFilterProps {
  onTestChange: (testId: string | null) => void;
  selectedTestId: string | null;
}

export function TestFilter({ onTestChange, selectedTestId }: TestFilterProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setIsLoading(true);
      const response = await testService.getTests();

      if (response.success && response.data) {
        setTests(response.data);

        // Default to the last test if available and no test is selected
        if (response.data.length > 0 && !selectedTestId) {
          const lastTest = response.data[response.data.length - 1];
          onTestChange(lastTest.id);
        }
      } else {
        console.error("Failed to fetch tests:", response.error);
      }
    } catch (error) {
      console.error("Failed to fetch tests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (value: string) => {
    onTestChange(value);
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="test-filter" className="text-sm font-medium whitespace-nowrap">
        Filter by Test:
      </Label>
      <Select
        value={selectedTestId || undefined}
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger id="test-filter" className="w-[250px]">
          <SelectValue placeholder={isLoading ? "Loading..." : "Select a test"} />
        </SelectTrigger>
        <SelectContent>
          {tests.map((test) => (
            <SelectItem key={test.id} value={test.id}>
              {test.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
