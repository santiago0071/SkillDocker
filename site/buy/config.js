/**
 * SkillDocker 官网公开客户端配置文件 (Client-side Public Configuration)
 * 
 * 注意安全规则：
 * 1. 本文件仅包含客户端公开信息，仓库提交时默认留空，由项目所有者在正式上线与审核完成后填写。
 * 2. 严禁在此存放服务端 API 密钥 (Secret Key) 或 Webhook 密钥！
 * 3. 当配置留空时，网站正常部署上线，购买按钮将如实显示“尚未开放购买”，其余页面不受任何影响。
 */
window.SKILLDOCKER_CONFIG = {
  // Paddle Billing (v2) 客户端令牌 (Client-side token, 正式环境格式如 "live_...")
  // 必须直接对接 Paddle 正式环境，不使用沙盒。
  paddleClientToken: 'live_ef1ae84987da385836c1bd99749',

  // Paddle Billing (v2) 价格 ID (Price ID, 格式如 "pri_01j...")
  // 对应 Catalog -> Products -> Prices 下创建的 SkillDocker Pro 买断价格实体。
  paddlePriceId: 'pri_01m4w6w4p83rjqyn5ee5jn7q6v',

  // Paddle Billing (v2) 早鸟折扣 ID (Discount ID, 格式如 "dsc_01j...")
  paddleDiscountId: 'dsc_01m4w6s4yx4dz2mvxwg7cm7hfv',
  paddleDiscountCode: 'LAUNCH30',

  // 客户端软件公开下载地址 (例如 GitHub Releases 或 Cloudflare R2 下载链接)。
  // 当前尚未公开发布，留空时官网下载按钮如实显示“即将发布”，配置有效地址后自动启用。
  downloadUrl: ''
};
