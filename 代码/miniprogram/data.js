const spaces = [
  { id: 'A-605', building: 'A座', floor: '6F', area: 320, price: 70, status: '空置', finish: '可分割', type: '研发办公', image: '/assets/campus-hero.jpg', note: '采光通透，适合 20–30 人团队灵活布局。' },
  { id: 'B-503', building: 'B座', floor: '5F', area: 245, price: 75, status: '空置', finish: '可分割', type: '研发办公', image: '/assets/campus-hero.jpg', note: '近共享会议区，方便研发团队协作。' },
  { id: 'C-401', building: 'C座', floor: '4F', area: 128, price: 65, status: '空置', finish: '可分割', type: '独立办公室', image: '/assets/campus-hero.jpg', note: '小而完整的创作主场，适合初创团队。' },
  { id: 'D-205', building: 'D座', floor: '2F', area: 320, price: 70, status: '空置', finish: '精装修', type: '独立办公室', image: '/assets/campus-hero.jpg', note: '精装交付，拎包即可开始办公。' },
  { id: 'E-103', building: 'E座', floor: '1F', area: 245, price: 75, status: '空置', finish: '精装修', type: '展示办公', image: '/assets/campus-hero.jpg', note: '一层临近园区入口，适合品牌展示。' }
]
const meetings = [
  { id: 'M-01', name: '榫卯会议室', capacity: '8人', location: 'A座 2F', area: 'A区', type: '小会议室', image: '/assets/meeting-01.jpg', gallery: ['/assets/meeting-01.jpg', '/assets/meeting-04.jpg'], price: 80, free: '本周剩余 2 小时', note: '适合日常沟通、面试和 4–8 人小型讨论，安静独立，支持无线投屏。', facilities: '无线投屏 · 白板 · 茶歇' },
  { id: 'M-02', name: '远山路演厅', capacity: '24人', location: 'A座 1F', area: 'A区', type: '路演厅', image: '/assets/meeting-02.jpg', gallery: ['/assets/meeting-02.jpg', '/assets/meeting-05.jpg', '/assets/meeting-06.jpg'], price: 180, free: '本周剩余 2 小时', note: '适合产品发布、培训和路演活动，配备大屏与专业音响。', facilities: 'LED大屏 · 音响 · 麦克风' },
  { id: 'M-03', name: '云杉会议室', capacity: '12人', location: 'C座 3F', area: 'C区', type: '中会议室', image: '/assets/meeting-03.jpg', gallery: ['/assets/meeting-03.jpg', '/assets/meeting-07.jpg'], price: 120, free: '本周剩余 2 小时', note: '自然采光的团队会议空间，适合项目评审和跨部门协作。', facilities: '投影 · 白板 · 视频会议' }
]
module.exports = { spaces, meetings }
