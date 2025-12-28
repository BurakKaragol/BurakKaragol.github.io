const translations = {
    // =========================================================================
    // ENGLISH
    // =========================================================================
    en: {
        professional: {
            logoText: "Burak Karagol",
            modeBadge: "Professional",
            switchLabel: "See my creative side",
            
            // NAVIGATION
            navHome: "Home", navHistory: "History", navSkills: "Skills", navProjects: "Projects", navContact: "Contact",
            mobNavHome: "Home", mobNavHistory: "History", mobNavSkills: "Skills", mobNavProjects: "Projects", mobNavContact: "Contact",
            
            heroStatus: "Open to collaborations",
            heroTitle: "Building Machines & Stories.",
            heroSub: "Mechatronics Engineer specialized in Aviation & Digital Solutions.",
            proHeroBtn: '<i class="fi fi-rr-briefcase"></i> View Case Studies',
            footerMsg: "Engineered in Istanbul.",
            
            // SECTION: HISTORY (Professional)
            histTitlePro: "Professional History",
            
            // 1. THY
            hist1Date: "11/2023 - Present",
            hist1Title: "Structural System Engineer",
            hist1Comp: "Turkish Airlines",
            hist1Desc: "Structural analysis and system engineering for aviation fleets.",

            // 2. Marmara Uni
            hist2Date: "2017 - 2023",
            hist2Title: "Mechatronics Engineering",
            hist2Comp: "Marmara University",
            hist2Desc: "Bachelor's Degree. Specialized in robotics and automation systems.",

            // 3. Rezonans
            hist3Date: "3 Years",
            hist3Title: "Full Time Engineer",
            hist3Comp: "Rezonans Elektronik",
            hist3Desc: "Comprehensive engineering role in electronics and systems.",

            // 4. Internships
            hist4Date: "Internships",
            hist4Title: "Engineering Internships",
            hist4Comp: "Multiple Companies",
            hist4Desc: "Beyaz.NET (4 Mos), Rezonans (6 Mos), Turkish Airlines (6 Mos).",

            // 5. High School
            hist5Date: "2013 - 2017",
            hist5Title: "Aircraft Technician",
            hist5Comp: "Bagcilar Anatolian Tech. HS",
            hist5Desc: "Specialized technical education in aircraft systems.",
            
            // SECTION: SKILLS (Professional)
            skillTitlePro: "Technical Arsenal",
            skPro1: "C", lvlPro1: "Advanced",
            skPro2: "C++", lvlPro2: "Advanced",
            skPro3: "C#", lvlPro3: "Advanced",
            skPro4: "Python", lvlPro4: "Upper Intermediate",
            skPro5: "SolidWorks", lvlPro5: "Advanced",
            skPro6: "Fusion 360", lvlPro6: "Upper Intermediate",
            skPro7: "Excel", lvlPro7: "Upper Intermediate",
            skPro8: "Bash", lvlPro8: "Pre Intermediate",
            skPro9: "SQL", lvlPro9: "Intermediate",
            
            // SECTION: PROJECTS (Professional - 9 Items)
            projTitlePro: "Engineering Projects",
            
            // 1. Robot
            proP1Title: "Self-Balancing Robot", proP1Desc: "Designed a two-wheeled robot using a PID control loop and IMU sensor data fusion (Kalman Filter).",
            proP1Tag1: "C++", proP1Tag2: "Control Theory",

            // 2. Robot Arm
            proP2Title: "6-DOF Robot Arm", proP2Desc: "Built and programmed a robotic arm, implementing Inverse Kinematics (IK) for precise coordinate movement.",
            proP2Tag1: "Python", proP2Tag2: "Robotics",

            // 3. CNC
            proP3Title: "CNC Pen Plotter", proP3Desc: "Built a 2-axis G-Code interpreter and stepper motor control system from scratch.",
            proP3Tag1: "Arduino", proP3Tag2: "Stepper Motors",

            // 4. Physics Engine
            proP4Title: "Physics Engine", proP4Desc: "Wrote a C++ 2D physics simulation engine handling collision detection and rigid body dynamics.",
            proP4Tag1: "C++", proP4Tag2: "Simulation",

            // 5. Vision
            proP5Title: "Vision Sorter", proP5Desc: "Used Python & OpenCV to identify and sort objects on a conveyor belt by color/shape.",
            proP5Tag1: "OpenCV", proP5Tag2: "Python",

            // 6. Flight Dynamics
            proP6Title: "Flight Dynamics Model", proP6Desc: "Created a realistic flight physics model in Unity calculating lift, drag, and thrust vectors in real-time.",
            proP6Tag1: "Unity", proP6Tag2: "Physics",

            // 7. IoT Hub
            proP7Title: "Smart Home Hub", proP7Desc: "Designed a custom PCB with ESP32 to bridge Zigbee sensors to a local Home Assistant server.",
            proP7Tag1: "ESP32", proP7Tag2: "PCB Design",

            // 8. 3D Printer
            proP8Title: "CoreXY 3D Printer", proP8Desc: "Designed and assembled a CoreXY 3D printer, compiling custom Marlin firmware for specific stepper drivers.",
            proP8Tag1: "Marlin", proP8Tag2: "SolidWorks",

            // 9. Lock
            proP9Title: "Biometric Lock", proP9Desc: "Created a fingerprint-based servo locking mechanism with a backup RFID entry system.",
            proP9Tag1: "C", proP9Tag2: "Embedded",

            // SECTION: CONTACT
            contTitlePro: "Contact & Inquiries",
            lblName: "Your Name / Company",
            lblEmail: "Business Email",
            lblMsg: "How can I help you?",
            btnSubmit: "Send Message",
            cardName: "Burak Karagol",
            cardRole: "Mechatronics Engineer"
        },
        personal: {
            logoText: "Burak K.",
            modeBadge: "Personal",
            switchLabel: "Back to business",
            
            // NAVIGATION
            navHome: "Start", navHistory: "My Story", navSkills: "Toolkit", navProjects: "Memories", navContact: "Say Hi",
            mobNavHome: "Start", mobNavHistory: "My Story", mobNavSkills: "Toolkit", mobNavProjects: "Memories", mobNavContact: "Say Hi",
            
            heroStatus: "Working on new projects...",
            heroTitle: "Assembling Models & Memories.",
            heroSub: "My personal playground where digital code meets physical reality. I share blueprints, failed prints, and the stories behind them.",
            persHeroBtn: '<i class="fi fi-rr-flask"></i> Explore the Workshop',
            footerMsg: "Built with logic and lots of coffee.",

            // SECTION: HISTORY (The 12 Realistic Memories)
            histTitlePers: "The Workshop Diaries",
            mem1Title: "Spaghetti Chef", mem1Desc: "The print failed overnight. Woke up to a plate of plastic noodles.",
            mem2Title: "Battle Scars", mem2Desc: "Learned the hard way which end of the soldering iron is hot.",
            mem3Title: "It Works Locally", mem3Desc: "My code worked perfectly on my machine. The server disagreed.",
            mem4Title: "Gravity Glitch", mem4Desc: "Set friction to negative. Watched my game character walk into orbit.",
            mem5Title: "Paper Ctrl+Z", mem5Desc: "Drawing on real paper. Made a mistake and tapped two fingers to undo.",
            mem6Title: "Magic Smoke", mem6Desc: "Forgot the resistor. The LED flashed once, then never again.",
            mem7Title: "Blender Crash", mem7Desc: "Spent 2 hours modeling. Blender crashed. I hadn't saved.",
            mem8Title: "Cable Chaos", mem8Desc: "Business in the front, spaghetti cable party behind the monitor.",
            mem9Title: "Infinite Loop", mem9Desc: "Wrote a loop without an exit. I think it is still running today.",
            mem10Title: "The Extra Screw", mem10Desc: "Reassembled the gadget. Found one screw left over. I call it 'weight reduction'.",
            mem11Title: "RGB Logic", mem11Desc: "Added LEDs to my case. It doesn't run faster, but it glows in 16 million colors.",
            mem12Title: "Percussive Fix", mem12Desc: "Fixed a loose connection by hitting it gently. Technical term: 'Mechanical Agitation'.",
            
            // SECTION: SKILLS (Personal)
            skillTitlePers: "Creative Toolkit",
            skPers1: "Unity", lvlPers1: "Advanced",
            skPers2: "Unreal Engine", lvlPers2: "Intermediate",
            skPers3: "Blender", lvlPers3: "Intermediate",
            skPers4: "Photoshop", lvlPers4: "Upper Intermediate",
            skPers5: "Illustrator", lvlPers5: "Intermediate",
            skPers6: "Web Dev", lvlPers6: "HTML/CSS/JS",
            skPers7: "Godot", lvlPers7: "Pre Intermediate",
            skPers8: "Java", lvlPers8: "Pre Intermediate",
            skPers9: "After Effects", lvlPers9: "Pre Intermediate",
            
            // SECTION: PROJECTS (Personal - Updated to match new HTML images)
            projTitlePers: "Models & Memories",
            
            // 1. Android Racing Game
            persP1Title: "Android Racing Game", 
            persP1Desc: "Mobile game development with physics.",

            // 2. Print Price Calc
            persP2Title: "Print Price Calc", 
            persP2Desc: "Custom 3D printing cost estimator tool.",

            // 3. Blender ArchViz
            persP3Title: "Blender ArchViz", 
            persP3Desc: "Photorealistic interior rendering.",

            // 4. FEA Simulation
            persP4Title: "FEA Simulation", 
            persP4Desc: "Fusion 360 static stress analysis.",

            // 5. Blender Scene
            persP5Title: "Blender Scene", 
            persP5Desc: "3D environment modeling.",

            // 6. Sorting Visualizer
            persP6Title: "Sorting Visualizer", 
            persP6Desc: "Python algorithm demonstration.",

            // 7. Pathfinding AI
            persP7Title: "Pathfinding AI", 
            persP7Desc: "A* search algorithm visualization.",

            // 8. Mini-Me Figure
            persP8Title: "Mini-Me Figure", 
            persP8Desc: "3D scanned and resin printed.",

            // 9. Space Shuttle
            persP9Title: "Space Shuttle", 
            persP9Desc: "High-detail 3D print model.",

            // 10. Jet Engine
            persP10Title: "Jet Engine", 
            persP10Desc: "High-detail 3D print model.",

            // 11. Dragon
            persP11Title: "Dragon", 
            persP11Desc: "High-detail 3D print model.",

            btnWebProjects: 'Browse Web Experiments <i class="fi fi-rr-globe"></i>',

            // SECTION: CONTACT
            contTitlePers: "Say Hi",
            discordUser: "burak#1234"
        }
    },
    
    // =========================================================================
    // TURKISH
    // =========================================================================
    tr: {
        professional: {
            logoText: "Burak Karagöl",
            modeBadge: "Profesyonel",
            switchLabel: "Yaratıcı tarafımı gör",
            
            // NAVIGATION
            navHome: "Ana Sayfa", navHistory: "Geçmiş", navSkills: "Yetenekler", navProjects: "Projeler", navContact: "İletişim",
            mobNavHome: "Ana Sayfa", mobNavHistory: "Geçmiş", mobNavSkills: "Yetenekler", mobNavProjects: "Projeler", mobNavContact: "İletişim",
            
            heroStatus: "İşbirliklerine açık",
            heroTitle: "Makineler ve Hikayeler İnşa Ediyorum.",
            heroSub: "Havacılık ve Dijital Çözümler üzerine uzmanlaşmış Mekatronik Mühendisi.",
            proHeroBtn: '<i class="fi fi-rr-briefcase"></i> Projeleri İncele',
            footerMsg: "İstanbul'da tasarlandı.",
            
            // SECTION: HISTORY
            histTitlePro: "Profesyonel Geçmiş",
            
            // 1. THY
            hist1Date: "11/2023 - Günümüz",
            hist1Title: "Yapısal Sistem Mühendisi",
            hist1Comp: "Türk Hava Yolları (THY)",
            hist1Desc: "Yapısal analiz ve sistem mühendisliği.",

            // 2. Marmara
            hist2Date: "2017 - 2023",
            hist2Title: "Mekatronik Mühendisliği",
            hist2Comp: "Marmara Üniversitesi",
            hist2Desc: "Lisans Derecesi. Robotik ve otomasyon sistemleri üzerine uzmanlık.",

            // 3. Rezonans
            hist3Date: "3 Yıl",
            hist3Title: "Tam Zamanlı Mühendis",
            hist3Comp: "Rezonans Elektronik",
            hist3Desc: "Elektronik ve sistemler üzerine kapsamlı mühendislik görevi.",

            // 4. Internships
            hist4Date: "Stajlar",
            hist4Title: "Mühendislik Stajları",
            hist4Comp: "Çeşitli Şirketler",
            hist4Desc: "Beyaz.NET (4 Ay), Rezonans (6 Ay), THY (6 Ay).",

            // 5. High School
            hist5Date: "2013 - 2017",
            hist5Title: "Uçak Bakım Teknisyeni",
            hist5Comp: "Bağcılar Anadolu Teknik Lisesi",
            hist5Desc: "Uçak Teknolojisi ve bakımı üzerine uzmanlık.",
            
            // SECTION: SKILLS
            skillTitlePro: "Teknik Yetenekler",
            skPro1: "C", lvlPro1: "İleri Seviye",
            skPro2: "C++", lvlPro2: "İleri Seviye",
            skPro3: "C#", lvlPro3: "İleri Seviye",
            skPro4: "Python", lvlPro4: "Orta-Üst Seviye",
            skPro5: "SolidWorks", lvlPro5: "İleri Seviye",
            skPro6: "Fusion 360", lvlPro6: "Orta-Üst Seviye",
            skPro7: "Excel", lvlPro7: "Orta-Üst Seviye",
            skPro8: "Bash", lvlPro8: "Orta-Alt Seviye",
            skPro9: "SQL", lvlPro9: "Orta Seviye",
            
            // SECTION: PROJECTS
            projTitlePro: "Mühendislik Projeleri",
            
            // 1. Robot
            proP1Title: "Kendi Dengesini Kuran Robot", proP1Desc: "PID kontrol döngüsü ve IMU sensör veri füzyonu (Kalman Filtresi) kullanarak iki tekerlekli robot tasarladım.",
            proP1Tag1: "C++", proP1Tag2: "Kontrol Teorisi",

            // 2. Robot Arm
            proP2Title: "6 Eksenli Robot Kol", proP2Desc: "Hassas koordinat hareketi için Ters Kinematik (IK) uygulayan bir robot kolu inşa ettim ve programladım.",
            proP2Tag1: "Python", proP2Tag2: "Robotik",

            // 3. CNC
            proP3Title: "CNC Kalem Çizici", proP3Desc: "Sıfırdan bir 2 eksenli G-Kodu yorumlayıcısı ve step motor kontrol sistemi kurdum.",
            proP3Tag1: "Arduino", proP3Tag2: "Step Motorlar",

            // 4. Physics Engine
            proP4Title: "Fizik Motoru", proP4Desc: "Çarpışma algılama ve katı cisim dinamiğini işleyen bir C++ 2D fizik simülasyon motoru yazdım.",
            proP4Tag1: "C++", proP4Tag2: "Simülasyon",

            // 5. Vision
            proP5Title: "Görüntü İşleme ile Ayıklama", proP5Desc: "Python ve OpenCV kullanarak bir konveyör bandındaki nesneleri renk/şekle göre ayıklaayan sistem.",
            proP5Tag1: "OpenCV", proP5Tag2: "Python",

            // 6. Flight Dynamics
            proP6Title: "Uçuş Dinamiği Modeli", proP6Desc: "Unity'de kaldırma, sürükleme ve itme vektörlerini gerçek zamanlı hesaplayan gerçekçi bir uçuş fizik modeli.",
            proP6Tag1: "Unity", proP6Tag2: "Fizik",

            // 7. IoT Hub
            proP7Title: "Akıllı Ev Merkezi", proP7Desc: "Zigbee sensörlerini yerel Home Assistant sunucusuna bağlamak için ESP32'li özel bir PCB tasarladım.",
            proP7Tag1: "ESP32", proP7Tag2: "PCB Tasarımı",

            // 8. 3D Printer
            proP8Title: "CoreXY 3D Yazıcı", proP8Desc: "Özel step sürücüleri için Marlin yazılımını derleyerek kendi CoreXY 3D yazıcımı tasarladım ve topladım.",
            proP8Tag1: "Marlin", proP8Tag2: "SolidWorks",

            // 9. Lock
            proP9Title: "Biyometrik Kilit", proP9Desc: "Yedek RFID giriş sistemine sahip, parmak izi tabanlı bir servo kilitleme mekanizması.",
            proP9Tag1: "C", proP9Tag2: "Gömülü Sistemler",

            // SECTION: CONTACT
            contTitlePro: "İletişim",
            lblName: "İsim / Şirket",
            lblEmail: "Kurumsal E-posta",
            lblMsg: "Size nasıl yardımcı olabilirim?",
            btnSubmit: "Mesajı Gönder",
            cardName: "Burak Karagöl",
            cardRole: "Mekatronik Mühendisi"
        },
        personal: {
            logoText: "Burak K.",
            modeBadge: "Kişisel",
            switchLabel: "İş moduna dön",
            
            // NAVIGATION
            navHome: "Giriş", navHistory: "Hikayem", navSkills: "Ekipmanlar", navProjects: "Anılar", navContact: "Selam",
            mobNavHome: "Giriş", mobNavHistory: "Hikayem", mobNavSkills: "Ekipmanlar", mobNavProjects: "Anılar", mobNavContact: "Selam",
            
            heroStatus: "Yeni projeler üzerinde çalışıyor...",
            heroTitle: "Modelleri ve Anıları Birleştiriyorum.",
            heroSub: "Dijital kodların fiziksel gerçekliğe dönüştüğü oyun alanım. Yarım kalan prototipler ve arkasındaki hikayeler.",
            persHeroBtn: '<i class="fi fi-rr-flask"></i> Atölyeyi Keşfet',
            footerMsg: "Mantık ve bol bol kahve ile inşa edilmiştir.",

            // SECTION: HISTORY
            histTitlePers: "Atölye Günlükleri",
            mem1Title: "Spagetti Şefi", mem1Desc: "Baskı gece bozulmuş. Uyandığımda plastik bir makarna tabağı buldum.",
            mem2Title: "Savaş Yaraları", mem2Desc: "Havyanın hangi ucunun sıcak olduğunu zor yoldan öğrendim.",
            mem3Title: "Bende Çalışıyordu", mem3Desc: "Kod bilgisayarımda kusursuzdu. Sunucu ise aynı fikirde değildi.",
            mem4Title: "Yerçekimi Hatası", mem4Desc: "Sürtünmeyi eksi yaptım. Karakterimin yörüngeye yürüyüşünü izledim.",
            mem5Title: "Kağıtta Ctrl+Z", mem5Desc: "Kağıda çizim yapıyordum. Hata yapınca geri almak için iki parmakla masaya vurdum.",
            mem6Title: "Sihirli Duman", mem6Desc: "Direnci unuttum. LED bir kere parladı, bir daha asla yanmadı.",
            mem7Title: "Blender Çöktü", mem7Desc: "2 saat modelleme yaptım. Blender çöktü. Kaydetmemiştim.",
            mem8Title: "Kablo Kaosu", mem8Desc: "Ön taraf düzenli ama monitörün arkasına sakın bakmayın.",
            mem9Title: "Sonsuz Döngü", mem9Desc: "Çıkışı olmayan bir döngü yazdım. Sanırım hala çalışıyor.",
            mem10Title: "Artan Vida", mem10Desc: "Cihazı topladım, bir vida arttı. Ben buna 'ağırlık azaltma çalışması' diyorum.",
            mem11Title: "RGB Mantığı", mem11Desc: "Kasaya LED döşedim. Daha hızlı çalışmıyor ama 16 milyon renkte parlıyor.",
            mem12Title: "Vurarak Tamir", mem12Desc: "Temassızlığı hafifçe vurarak çözdüm. Mühendislikte buna 'Mekanik Ajitasyon' denir.",
            
            // SECTION: SKILLS
            skillTitlePers: "Yaratıcı Araçlar",
            skPers1: "Unity", lvlPers1: "İleri Seviye",
            skPers2: "Unreal Engine", lvlPers2: "Orta Seviye",
            skPers3: "Blender", lvlPers3: "Orta Seviye",
            skPers4: "Photoshop", lvlPers4: "Orta-Üst Seviye",
            skPers5: "Illustrator", lvlPers5: "Orta Seviye",
            skPers6: "Web Geliştirme", lvlPers6: "Orta-Alt Seviye",
            skPers7: "Godot", lvlPers7: "Orta-Alt Seviye",
            skPers8: "Java", lvlPers8: "Orta-Alt Seviye",
            skPers9: "After Effects", lvlPers9: "Orta-Alt Seviye",
            
            // SECTION: PROJECTS (Personal - Updated)
            projTitlePers: "Modeller ve Anılar",
            
            // 1. Android Racing Game
            persP1Title: "Android Yarış Oyunu", 
            persP1Desc: "Fizik tabanlı mobil oyun geliştirme.",

            // 2. Print Price Calc
            persP2Title: "Baskı Maliyet Hesaplayıcı", 
            persP2Desc: "Özel 3D baskı maliyet hesaplama aracı.",

            // 3. Blender ArchViz
            persP3Title: "Blender Mimari Görselleştirme", 
            persP3Desc: "Fotogerçekçi iç mekan renderı.",

            // 4. FEA Simulation
            persP4Title: "FEA Simülasyonu", 
            persP4Desc: "Fusion 360 statik gerilme analizi.",

            // 5. Blender Scene
            persP5Title: "Blender Sahnesi", 
            persP5Desc: "3D çevre modellemesi.",

            // 6. Sorting Visualizer
            persP6Title: "Sıralama Görselleştirici", 
            persP6Desc: "Python algoritma gösterimi.",

            // 7. Pathfinding AI
            persP7Title: "Yol Bulma Yapay Zekası", 
            persP7Desc: "A* arama algoritması görselleştirmesi.",

            // 8. Mini-Me Figure
            persP8Title: "Mini-Ben Figürü", 
            persP8Desc: "3D tarama ve reçine baskı.",

            // 9. Space Shuttle
            persP9Title: "Uzay Mekiği", 
            persP9Desc: "Yüksek detaylı 3D baskı modeli.",

            // 10. Jet Engine
            persP10Title: "Jet Motoru", 
            persP10Desc: "Yüksek detaylı 3D baskı modeli.",

            // 11. Dragon
            persP11Title: "Ejderha", 
            persP11Desc: "Yüksek detaylı 3D baskı modeli.",

            btnWebProjects: 'Web Projelerini Keşfet <i class="fi fi-rr-globe"></i>',

            // SECTION: CONTACT
            contTitlePers: "Selam Ver",
            discordUser: "burak#1234"
        }
    }
};

function updateTextContent(lang, mode) {
    const currentData = translations[lang][mode];
    const switchLabel = document.getElementById('switchLabel');
    if(switchLabel) switchLabel.innerText = currentData['switchLabel'];

    for (const key in currentData) {
        const element = document.getElementById(key);
        if (element) {
            // Using innerHTML allows icons to render
            element.innerHTML = currentData[key];
        }
    }
}