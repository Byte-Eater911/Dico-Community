(function () {
  "use strict";

  const CATEGORIES = [
    { id: "ai", label: "AI & Data", match: /artificial intelligence|data science|\bai\b|generative/i },
    { id: "programming", label: "Programming", match: /mobile development|web development|web developer|system integration|\biot\b|network engineer/i },
    { id: "uiux", label: "UI/UX & Design", match: /ui ?\/?\ ?ux|graphic design|design grafis/i },
    { id: "digitalmarketing", label: "Digital Marketing", match: /digital marketing|ecommerce|branding|communication|marcom|marketing komunikasi/i },
    { id: "contentcreator", label: "Content Creator", match: /content creation|video production|photography|content creator|creative content|multimedia/i },
    { id: "business", label: "Business & Leadership", match: /project management|leadership|digital transformation|sustainable cities/i },
  ];

  const photo = (id) => "assets/images/experts/" + id + ".jpg";

  const RAW = [
    { id: "walim", name: "Walim, M.Kom", role: "Marketing Komunikasi", skills: ["Digital Marketing"], moreSkills: 0, bio: "Expert dalam Digital Marketing dan Marketing Komunikasi" },
    { id: "fajar-akbar", name: "Fajar Akbar, S.Kom, M.Kom", role: "Lecturer, AI Practitioner", skills: ["Artificial Intelligence", "Data Science"], moreSkills: 0, bio: "Praktisi AI dan Data Science dengan pengalaman lebih dari 10 tahun" },
    { id: "deni-gunawan", name: "Deni Gunawan, M.Kom", role: "AI Specialist, Design Grafis, Web Developer, Event Planner", skills: ["Artificial Intelligence", "Mobile Development", "Web Development", "UI UX Design", "Content Creation", "Video Production"], moreSkills: 14, bio: "Spesialis AI dengan keahlian lintas bidang di design, development, dan content creation" },
    { id: "hasan-basri", name: "Hasan Basri, M.Kom", role: "Dosen", skills: ["Artificial Intelligence", "Content Creation"], moreSkills: 0, bio: "Dosen berpengalaman dalam AI dan Content Creation" },
    { id: "agung-fazriansyah", name: "Agung Fazriansyah", role: "Lecturer, Marcom, Relationship Officer", skills: ["Artificial Intelligence", "Data Science", "Digital Transformation", "UI UX Design", "Branding", "Communication"], moreSkills: 3, bio: "Dosen dan profesional marcom dengan fokus pada transformasi digital" },
    { id: "sugiono", name: "Sugiono, M.Kom", role: "Lecturer", skills: ["Artificial Intelligence", "Mobile Development", "Web Development", "Digital Marketing", "Content Creation", "Video Production"], moreSkills: 1, bio: "Dosen dengan keahlian komprehensif di bidang teknologi dan digital" },
    { id: "ricki-sastra", name: "Ricki Sastra, M.Kom", role: "Dosen, Asesor Kompetensi, Generative AI Specialist", skills: ["Artificial Intelligence", "Mobile Development", "Web Development", "Digital Transformation", "Project Management", "UI UX Design"], moreSkills: 3, bio: "Spesialis Generative AI dan asesor kompetensi profesional" },
    { id: "bryan-givan", name: "Bryan Givan, S.E, M.M", role: "Content Creator", skills: ["Project Management", "Digital Marketing", "Content Creation", "Leadership"], moreSkills: 0, bio: "Content creator dan leader dalam digital marketing" },
    { id: "nurul-ichsan", name: "Nurul Ichsan, M.Kom", role: "Creative Content, Public Speaker", skills: ["Artificial Intelligence", "Digital Marketing"], moreSkills: 0, bio: "Pembicara publik dan content creator profesional" },
    { id: "verry-riyanto", name: "Verry Riyanto", role: "Dosen", skills: ["Artificial Intelligence", "IoT", "Digital Transformation", "Project Management", "Video Production", "Sustainable Cities Communities"], moreSkills: 0, bio: "Dosen fokus pada IoT dan transformasi digital berkelanjutan" },
    { id: "andry-maulana", name: "Andry Maulana, M.Kom", role: "Network Engineer", skills: ["System Integration"], moreSkills: 0, bio: "Network engineer dan sistem integrator profesional" },
    { id: "hendri-mahmud-nawawi", name: "Hendri Mahmud Nawawi", role: "Dosen, Web Developer", skills: ["Data Science", "Web Development", "Content Creation"], moreSkills: 0, bio: "Web developer dan data scientist berpengalaman" },
    { id: "ibnu-alfarobi", name: "Ibnu Alfarobi, M.Kom", role: "Dosen", skills: ["Artificial Intelligence", "Digital Marketing", "Ecommerce"], moreSkills: 0, bio: "Dosen dengan keahlian AI dan ecommerce" },
    { id: "agung-baitul-hikmah", name: "Agung Baitul Hikmah", role: "Dosen dan Narsum", skills: ["Artificial Intelligence", "Digital Marketing"], moreSkills: 0, bio: "Dosen dan pembicara ahli dalam AI dan digital marketing" },
    { id: "iyad-supriadin", name: "Iyad Supriadin", role: "Multimedia Creative", skills: ["Digital Marketing", "Content Creation", "Video Production", "Graphic Design", "Photography", "Leadership"], moreSkills: 2, bio: "Creative multimedia profesional dengan keahlian multidisiplin" },
  ];

  function processExperts(list) {
    return list.map((e) => {
      const skills = Array.isArray(e.skills) ? e.skills : [];
      const text = skills.join(" ") + " " + (e.role || "");
      let cats = CATEGORIES.filter((c) => c.match.test(text)).map((c) => c.id);
      if (!cats.length) cats = ["business"];
      return Object.assign({}, e, {
        photo: e.foto_url || e.photo || photo(e.id),
        name: e.name || e.nama,
        categories: cats,
        skills: skills,
        moreSkills: e.moreSkills || 0,
        bio: e.bio || ""
      });
    });
  }

  let EXPERTS = processExperts(RAW);

  const getExpert = (id) => EXPERTS.find((e) => e.id === id) || null;

  window.DICO_EXPERTS = {
    EXPERTS,
    CATEGORIES,
    getExpert,
    loaded: true
  };

  async function loadLiveExperts() {
    try {
      const res = await fetch("api/get_experts.php?_t=" + Date.now());
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        EXPERTS = processExperts(json.data);
        window.DICO_EXPERTS.EXPERTS = EXPERTS;
        document.dispatchEvent(new CustomEvent("DicoExpertsLoaded", { detail: EXPERTS }));
      }
    } catch (e) {
      // Keep static data
    }
  }

  loadLiveExperts();
})();
