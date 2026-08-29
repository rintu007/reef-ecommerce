import { getAdminConversation, listAdminReports, updateReportStatus, type AdminMessage, type AdminReport, type ReportStatus } from "@reef-market/shared";
import { Link, Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { markAdminBadgeSeen } from "@/components/admin/NewSinceBadge";
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
  expanded,
  conversation,
  conversationLoading,
  onToggleConversation,
}: {
  report: AdminReport;
  busy: boolean;
  onSetStatus: (status: ReportStatus) => void;
  expanded: boolean;
  conversation: AdminMessage[];
  conversationLoading: boolean;
  onToggleConversation: () => void;
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
      {report.reported_id && (
        <Pressable onPress={onToggleConversation} className="mt-1">
          <Text className="text-xs text-primary">{expanded ? "Hide conversation" : "View conversation"}</Text>
        </Pressable>
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

      {expanded && (
        <View className="mt-3 pt-3 border-t border-border gap-1.5">
          <Text className="text-xs font-semibold text-muted-foreground">Conversation between reporter and reported user</Text>
          {conversationLoading ? (
            <Text className="text-xs text-muted-foreground">Loading…</Text>
          ) : conversation.length === 0 ? (
            <Text className="text-xs text-muted-foreground">No messages between these two users.</Text>
          ) : (
            conversation.map((m) => (
              <View key={m.id}>
                <Text className="text-xs">
                  <Text className="font-semibold text-foreground">{m.sender_display_name ?? m.sender_email ?? m.sender_id}</Text>
                  <Text className="text-muted-foreground"> · {new Date(m.created_at).toLocaleString()}</Text>
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">{m.content}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

function AdminReportsContent() {
  const [status, setStatus] = useState<ReportStatus | "all">("pending");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<AdminMessage[]>([]);
  const [conversationLoading, setConversationLoading] = useState(false);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      listAdminReports(apiClient, { status: "pending", limit: 1 }).then(({ total }) => markAdminBadgeSeen("reports", total));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  async function toggleConversation(report: AdminReport) {
    if (expandedId === report.id) {
      setExpandedId(null);
      return;
    }
    if (!report.reported_id) return;
    setExpandedId(report.id);
    setConversationLoading(true);
    try {
      const { messages } = await getAdminConversation(apiClient, report.reporter_id, report.reported_id);
      setConversation(messages);
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setConversationLoading(false);
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
              expanded={expandedId === report.id}
              conversation={conversation}
              conversationLoading={conversationLoading}
              onToggleConversation={() => toggleConversation(report)}
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
