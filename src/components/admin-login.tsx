import { useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/app-text";
import { Eyebrow, Notice, PortalScreen } from "@/components/portal-ui";
import { AppButton, AppInput, SectionLabel } from "@/components/ui";
import { useBlogSession } from "@/context/blog-session";
import { apiConfigured, blogAPI } from "@/lib/blog-api";

export function AdminLogin() {
  const { setToken } = useBlogSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function login() {
    if (busy) return;
    if (!username || !password) { setError("请输入管理员用户名和密码。"); return; }
    setBusy(true); setError("");
    try { const session = await blogAPI.login(username, password); setPassword(""); setToken(session.token); }
    catch (e) { setError(e instanceof Error ? e.message : "登录失败"); }
    finally { setBusy(false); }
  }
  return <PortalScreen>
    <Eyebrow>PRIVATE STUDIO</Eyebrow>
    <AppText accessibilityRole="header" className="mb-3 text-[34px] font-semibold">回到写作的地方。</AppText>
    <AppText className="mb-8 text-sm leading-6">管理员登录后，可以写作、保存草稿和发布文章。访客阅读无需登录。</AppText>
    {!apiConfigured && <Notice message="请先部署 API，并设置前端的 EXPO_PUBLIC_API_URL。连接后即可登录。" />}
    <View className="gap-4">
      <View><SectionLabel>用户名</SectionLabel><AppInput accessibilityLabel="管理员用户名" autoCapitalize="none" autoComplete="username" value={username} onChangeText={setUsername} /></View>
      <View><SectionLabel>密码</SectionLabel><AppInput accessibilityLabel="管理员密码" secureTextEntry autoComplete="current-password" value={password} onChangeText={setPassword} onSubmitEditing={() => void login()} /></View>
      {Boolean(error) && <Notice message={error} />}
      <AppButton label={busy ? "正在登录…" : "进入写作台"} disabled={busy || !apiConfigured} onPress={() => void login()} />
    </View>
  </PortalScreen>;
}

