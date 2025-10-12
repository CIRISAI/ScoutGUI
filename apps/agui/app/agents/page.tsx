'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAgent } from '@/contexts/AgentContextHybrid';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusDot } from '@/components/Icons';

export default function AgentsPage() {
  const { user } = useAuth();
  const { currentAgent } = useAgent();

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Scout Agent</h1>

        <div className="grid gap-4">
          {currentAgent && (
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{currentAgent.agent_name}</CardTitle>
                  <StatusDot status={currentAgent.health === 'healthy' ? 'green' : 'yellow'} />
                </div>
                <CardDescription>
                  Agent ID: {currentAgent.agent_id} | Status: {currentAgent.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  API URL: {currentAgent.api_endpoint || `${currentAgent.api_url || 'localhost'}:${currentAgent.api_port || 8080}`}
                </p>
                <p className="text-sm text-primary mt-2">Active</p>
              </CardContent>
            </Card>
          )}

          {!currentAgent && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Scout agent not available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
