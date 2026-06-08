const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

const LOCATIONS = [
  { id: 'stairs', name: '안랩 계단', secret: 'stairs-secret-2026' },
  { id: 'history', name: '히스토리관', secret: 'history-secret-2026' },
  { id: 'cafe', name: '카페', secret: 'cafe-secret-2026' },
  { id: 'qa', name: 'QA룸', secret: 'qa-secret-2026' },
  { id: 'soc', name: 'SOC (관제센터)', secret: 'soc-secret-2026' },
  { id: 'lounge', name: '휴게실', secret: 'lounge-secret-2026' },
  { id: 'rooftop', name: '옥상정원', secret: 'rooftop-secret-2026' },
]

const outputDir = path.join(__dirname, '../public/qrcodes')

// 폴더 생성
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
  console.log(`📁 폴더 생성: ${outputDir}`)
}

// QR 코드 생성
async function generateQRCodes() {
  console.log('\n🔄 QR 코드 생성 중...\n')

  for (const location of LOCATIONS) {
    try {
      const filePath = path.join(outputDir, `${location.id}.png`)

      await QRCode.toFile(filePath, location.secret, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      console.log(`✅ ${location.name} (${location.id})`)
      console.log(`   파일: ${filePath}`)
      console.log(`   데이터: ${location.secret}\n`)
    } catch (error) {
      console.error(`❌ ${location.name} 생성 실패:`, error.message)
    }
  }

  console.log('✨ 모든 QR 코드가 생성되었습니다!')
  console.log(`\n📍 위치: ${outputDir}`)
  console.log('💡 각 QR 코드를 인쇄해서 해당 장소에 부착하세요.\n')
}

generateQRCodes().catch(console.error)
