import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, Download, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const { toast } = useToast();
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  
  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      const res = await apiRequest('PUT', '/api/settings', settingsData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Import data mutation
  const importDataMutation = useMutation({
    mutationFn: async (jsonData: string) => {
      const res = await apiRequest('POST', '/api/import', { jsonData });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/heap'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Data imported",
        description: "Your calendar data has been imported successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to import data",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Export data
  const handleExport = () => {
    // Create a download link for the exported data
    window.open('/api/export', '_blank');
  };
  
  // Handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setJsonFile(e.target.files[0]);
    }
  };
  
  // Handle import
  const handleImport = async () => {
    if (!jsonFile) {
      toast({
        title: "No file selected",
        description: "Please select a JSON file to import.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const text = await jsonFile.text();
      importDataMutation.mutate(text);
    } catch (error) {
      toast({
        title: "Failed to read file",
        description: "The selected file could not be read.",
        variant: "destructive",
      });
    }
  };
  
  // Update a single setting
  const updateSetting = (key: string, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }
  
  return (
    <div className="p-6 h-full overflow-auto">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your calendar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultView">Default View</Label>
                <Select 
                  defaultValue={settings?.defaultView || "month"}
                  onValueChange={(value) => updateSetting('defaultView', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select 
                  defaultValue={settings?.theme || "dark"}
                  onValueChange={(value) => updateSetting('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Export or import your calendar data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button onClick={handleExport} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Calendar Data
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="importFile">Import Data</Label>
                <Input
                  id="importFile"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="bg-primary border-gray-700"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleImport}
                disabled={!jsonFile || importDataMutation.isPending}
              >
                {importDataMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>
                Configure the AI assistant for your calendar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="useAI">Enable AI Assistant</Label>
                  <p className="text-sm text-muted-foreground">
                    Let the AI help you schedule your heap tasks.
                  </p>
                </div>
                <Switch
                  id="useAI"
                  checked={settings?.useAI}
                  onCheckedChange={(checked) => updateSetting('useAI', checked)}
                />
              </div>
              
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  The AI assistant uses machine learning to analyze your calendar patterns and suggest optimal scheduling times for your heap tasks.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
