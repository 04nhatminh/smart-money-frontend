// Expo đọc app.json trước, rồi truyền vào đây dưới dạng `config`.
// File này tồn tại để tiêm các giá trị phụ thuộc môi trường (không hardcode được
// trong JSON tĩnh) — hiện tại là cấu hình Google Sign-In cho iOS.

/**
 * Google cấp iOS client ID dạng:
 *   123456789-abcdefg.apps.googleusercontent.com
 * URL scheme iOS là chuỗi đó đảo ngược:
 *   com.googleusercontent.apps.123456789-abcdefg
 * Suy ra được nên chỉ cần một biến môi trường duy nhất.
 */
function toReversedClientId(clientId) {
  if (!clientId) return undefined;
  const suffix = '.apps.googleusercontent.com';
  if (!clientId.endsWith(suffix)) {
    throw new Error(
      `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID không đúng định dạng (phải kết thúc bằng "${suffix}"): ${clientId}`
    );
  }
  return `com.googleusercontent.apps.${clientId.slice(0, -suffix.length)}`;
}

module.exports = ({ config }) => {
  const iosUrlScheme = toReversedClientId(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
  );

  // Thiếu biến này thì build iOS vẫn chạy nhưng nút Google login sẽ hỏng lúc
  // runtime — cảnh báo sớm ở đây để không phải chờ hết một lượt build mới biết.
  if (!iosUrlScheme) {
    console.warn(
      '[app.config.js] Thiếu EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID — Google Sign-In sẽ không hoạt động trên iOS.\n' +
        '  Local: điền vào .env | EAS: npx eas-cli env:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ...'
    );
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        '@react-native-google-signin/google-signin',
        iosUrlScheme ? { iosUrlScheme } : {},
      ],
    ],
  };
};
