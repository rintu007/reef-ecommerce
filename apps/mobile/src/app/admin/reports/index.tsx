import { listAdminReports, updateReportStatus, type AdminReport, type ReportStatus } from "@reef-market/shared";
import { Link, Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { notify } from "@/lib/alert";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { safeGoBack } from "@/lib/navigation";

// Mirrors apps/web/src/app/admin/reports/AdminReportsTable.tsx's STATUS_TABS exactly.
const STATUS_TABS: { value: ReportStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

function ReportRow({
  report,
  busy,
  onSetStatus,
}: {
  report: AdminReport;
  busy: boolean;
  onSetStatus: (status: ReportStatus) => void;
}) {
  return (
    <View className="rounded-xl border border-border bg-card p-3">
      <Text className="text-xs text-muted-foreground uppercase font-semibold">
        {report.report_type} report · {report.status}
      </Text>
      <Text className="text-sm font-semibold text-foreground mt-1">{report.reason}</Text>
      {report.details && <Text className="text-sm text-muted-foreground mt-1">{report.details}</Text>}
      <Text className="text-xs text-muted-foreground mt-2">
        Reported by {report.reporter?.display_name ?? report.reporter?.email ?? "unknown"}
        {report.reported ? ` about ${report.reported.display_name ?? report.reported.email}` : ""}
      </Text>
      {report.listing && (
        <Link href={`/listing/${report.listing.id}`} asChild>
          <Pressable>
            <Text className="text-xs text-primary font-semibold mt-1">{report.listing.title}</Text>
          </Pressable>
        </Link>
      )}
      <View className="flex-row gap-4 mt-3">
        {report.status !== "resolved" && (
          <Pressable disabled={busy} onPress={() => onSetStatus("resolved")}>
            <Text className="text-sm font-semibold text-primary" style={busy ? { opacity: 0.5 } : undefined}>
              Resolve
            </Text>
          </Pressable>
        )}
        {report.status !== "dismissed" && (
          <Pressable disabled={busy} onPress={() => onSetStatus("dismissed")}>
            <Text className="text-sm font-semibold text-muted-foreground" style={busy ? { opacity: 0.5 } : undefined}>
              Dismiss
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function AdminReportsContent() {
  const [status, setStatus] = useState<ReportStatus | "all">("pending");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { reports } = await listAdminReports(apiClient, {
        status: status === "all" ? undefined : status,
        limit: 100,
      });
      setReports(reports);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function setReportStatus(id: string, newStatus: ReportStatus) {
    setBusyId(id);
    try {
      await updateReportStatus(apiClient, id, newStatus);
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to update report");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
      <View className="flex-row gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <Pressable
            key={tab.value}
            onPress={() => setStatus(tab.value)}
            className={`px-3 py-1.5 rounded-full ${status === tab.value ? "bg-primary" : "bg-muted"}`}
          >
            <Text className={`text-sm font-semibold ${status === tab.value ? "text-primary-foreground" : "text-muted-foreground"}`}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : reports.length === 0 ? (
        <View className="items-center py-24 px-6">
          <Text className="text-muted-foreground text-center">No reports in this view.</Text>
        </View>
      ) : (
        <View className="gap-2">
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              busy={busyId === report.id}
              onSetStatus={(newStatus) => setReportStatus(report.id, newStatus)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default function AdminReportsScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Reports</Text>
        </View>
        <AdminReportsContent />
      </SafeAreaView>
    </AdminGate>
  );
}
