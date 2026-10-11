import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Clock, 
  Download, 
  Eye, 
  Plus,
  User,
  LogOut,
  LayoutDashboard,
  Activity,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  Leaf,
  Shield,
  Zap,
  BarChart3,
  FileCheck,
  ArrowUpRight,
  Trash2
} from 'lucide-react';
import UploadForm from '../components/UploadForm';
import CameraCapture from '../components/CameraCapture';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const normalizePdfUrl = (pdfUrl) => {
  if (!pdfUrl) return null
  const fixedUrl = pdfUrl.replace(/\\/g, '/')
  const localPath = fixedUrl.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i, '')
  if (/^https?:\/\//i.test(fixedUrl) && !/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i.test(fixedUrl)) return fixedUrl
  return `${BACKEND.replace(/\/+$/, '')}/${localPath.replace(/^\/+/, '')}`
}

const BimaSetuDashboard = () => {
  const { user, farmerId } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [captureData, setCaptureData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    recentReports: 0,
    pendingAnalysis: 0,
    accuracyRate: 0
  });

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    
    const fetchClaims = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/claims?uid=${encodeURIComponent(user.uid)}`);
        const json = await res.json();
        if (json.success && isMounted) {
          const claims = json.data?.claims || [];
          const mapped = claims.map(c => {
            const pdfUrl = c.pdf_path ? normalizePdfUrl(c.pdf_path) : null;
            return {
              id: c.id,
              cropName: c.damage_type || t('dashboard.cropAssessment'),
              location: c.lat && c.lng ? `${Number(c.lat).toFixed(4)}, ${Number(c.lng).toFixed(4)}` : t('dashboard.farmField'),
              date: c.timestamp ? new Date(c.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              damagePercent: Number(c.damage_pct || 0).toFixed(1),
              status: c.status || 'completed',
              reportUrl: pdfUrl
            };
          });
          setAssessments(mapped);
          
          setStats({
            totalAssessments: mapped.length,
            recentReports: mapped.filter(m => {
              const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
              return new Date(m.date).getTime() > weekAgo;
            }).length,
            pendingAnalysis: mapped.filter(m => m.status !== 'completed').length,
            accuracyRate: mapped.length ? Math.round(claims.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / claims.length * 100) : 0
          });
        }
      } catch (err) {
        console.error("Error loading claims in dashboard: ", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchClaims();
    return () => { isMounted = false; };
  }, [user?.uid]);

  const handleCameraCapture = (data) => {
    if (!data) {
      setCaptureData(null);
      setSelectedImage(null);
      return;
    }
    if (!data.lat || !data.lng || data.lat === 0.0 || data.lng === 0.0) {
      setError("Geo-tag location missing. Enable GPS.");
      setCaptureData(null);
      setSelectedImage(null);
      return;
    }
    setError(null);
    setSelectedImage(URL.createObjectURL(data.blob));
    setCaptureData(data);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setCaptureData(null);
    setSelectedImage(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (!lat || !lng) {
            setError("Geo-tag location missing. Enable GPS.");
            setUploading(false);
            return;
          }
          setSelectedImage(URL.createObjectURL(file));
          setCaptureData({
            blob: file,
            timestamp: new Date().toISOString(),
            lat: lat,
            lng: lng,
          });
          setUploading(false);
        },
        (err) => {
          console.error("GPS error on upload:", err);
          setError("Geo-tag location missing. Enable GPS.");
          setUploading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setError("Geo-tag location missing. Enable GPS.");
      setUploading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!analysisResult?.reportUrl) {
      alert(t('dashboard.noPdf'))
      return
    }
    window.open(normalizePdfUrl(analysisResult.reportUrl), '_blank')
  };

  const handleDownloadPDF = (pdfUrl) => {
    if (!pdfUrl) {
      alert(t('dashboard.pdfNotGenerated'))
      return
    }
    const fixedUrl = normalizePdfUrl(pdfUrl)
    window.open(fixedUrl, '_blank')
  };


  const handleViewReport = (assessmentId) => {
    const report = assessments.find((a) => a.id === assessmentId)
    if (report?.reportUrl) {

        window.open(

        normalizePdfUrl(report.reportUrl),

        '_blank'

        )

        }

        else{

        alert(

        t('dashboard.reportUnavailable')

        )

        }

    };

  const handleDeleteReport = async (assessmentId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return false;
    }
    try {
      const res = await fetch(`${BACKEND}/api/claims/${assessmentId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setAssessments((prev) => prev.filter((a) => a.id !== assessmentId));
        setStats((prev) => {
          const total = Math.max(0, prev.totalAssessments - 1);
          return {
            ...prev,
            totalAssessments: total,
            recentReports: Math.max(0, prev.recentReports - 1)
          };
        });
        return true;
      } else {
        alert(json.error || "Failed to delete claim");
        return false;
      }
    } catch (err) {
      console.error("Error deleting claim:", err);
      alert("Error deleting report. Please try again.");
      return false;
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="group rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg bg-white border border-[#E6DCC9]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1 font-semibold">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ) : (
            <p className="text-3xl font-bold text-[#10261C]">{value}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#E88125]" />
              <span className="text-xs text-gray-500 font-medium">{t('dashboard.trend')}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${color} transition-all duration-300 group-hover:scale-110 shadow-sm`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl p-6 bg-white border border-[#E6DCC9]">
            <div className="flex justify-between">
              <div>
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-6 bg-white border border-[#E6DCC9]">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );

  const getDamageColor = (percent) => {
    if (percent < 30) return 'text-green-800 bg-green-50 border border-green-200';
    if (percent < 60) return 'text-amber-800 bg-amber-50 border border-amber-200';
    return 'text-red-800 bg-red-50 border border-red-200';
  };

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-[#10261C]">
      {/* Dashboard Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Header with User Profile */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#10261C] mb-2">{t('dashboard.title')}</h1>
            <p className="text-gray-500 font-medium">{t('dashboard.welcome', { name: user?.name || user?.displayName || user?.phoneNumber || t('common.farmer') })}</p>
          </div>
          {/* User Profile Summary */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-[#E6DCC9] shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E88125] to-[#cf6f1b] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[#10261C] font-semibold text-sm">{user?.name || user?.displayName || user?.phoneNumber || t('common.farmer')}</p>
                <p className="text-gray-500 text-xs">{t('dashboard.farmerId')}: {farmerId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard 
                title={t('dashboard.totalAssessments')} 
                value={stats.totalAssessments} 
                icon={BarChart3}
                color="from-blue-500 to-blue-600"
                trend={true}
              />
              <StatCard 
                title={t('dashboard.recentReports')} 
                value={stats.recentReports} 
                icon={FileText}
                color="from-emerald-600 to-emerald-700"
                trend={true}
              />
              <StatCard 
                title={t('dashboard.pendingAnalysis')} 
                value={stats.pendingAnalysis} 
                icon={Clock}
                color="from-[#E88125] to-[#cf6f1b]"
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Area - Left & Center (2/3 width) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Crop Image Upload Card */}
                <div className="rounded-2xl p-6 transition-all duration-300 bg-white border border-[#E6DCC9] shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-[#10261C]">{t('dashboard.cropUpload')}</h2>
                      <p className="text-gray-500 text-sm mt-1 font-medium">{t('dashboard.uploadDesc')}</p>
                    </div>
                    <Shield className="w-8 h-8 text-[#E88125]/85" />
                  </div>

                  {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-800 text-sm font-medium">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <input id="cropUpload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />

                  {uploading ? (
                    <div className="py-12 text-center bg-[#FCFAF5] border border-[#E6DCC9] rounded-2xl shadow-inner">
                      <Loader2 className="w-12 h-12 text-[#E88125] mx-auto mb-4 animate-spin" />
                      <p className="text-[#E88125] font-semibold">{t('dashboard.analyzing')}</p>
                      <p className="text-gray-500 text-sm mt-2">{t('dashboard.waitProcess')}</p>
                    </div>
                  ) : analysisResult ? (
                    <div className="space-y-5 p-6 bg-[#FCFAF5] border border-[#E6DCC9] rounded-2xl text-center animate-fade-up shadow-sm">
                      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-left">
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-xl flex-shrink-0 text-white font-bold">
                          ✓
                        </div>
                        <div>
                          <p className="font-semibold text-green-800">{t('result.complete') || 'Assessment Complete'}</p>
                          <p className="text-xs text-green-600 font-mono font-medium">
                            ID: {analysisResult.id}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 text-left border border-[#E6DCC9] space-y-4 shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#FCFAF5] rounded-xl p-4 text-center border border-[#E6DCC9]">
                            <p className="text-3xl font-bold text-[#10261C]">{analysisResult.damagePercent}%</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">{t('result.cropDamaged') || 'Crop Damaged'}</p>
                          </div>
                          <div className="bg-[#FCFAF5] rounded-xl p-4 text-center border border-[#E6DCC9]">
                            <p className="text-3xl font-bold text-[#E88125] capitalize">🌾</p>
                            <p className="text-sm font-bold text-[#10261C] capitalize mt-1">{analysisResult.cropName}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{t('result.damageType') || 'Damage Type'}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-3">
                          <span className="text-gray-500 font-semibold">{t('dashboard.date') || 'Date'}:</span>
                          <span className="font-bold text-[#10261C]">{analysisResult.date}</span>
                        </div>

                        <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-3">
                          <span className="text-gray-500 font-semibold">{t('dashboard.status') || 'Status'}:</span>
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {t('common.completed') || 'Completed'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        {analysisResult.reportUrl && (
                          <button
                            onClick={() => handleDownloadPDF(analysisResult.reportUrl)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#E88125] hover:bg-[#cf6f1b] text-white font-bold hover:shadow-lg transition-all duration-300"
                          >
                            <Download className="w-4 h-4" />
                            {t('dashboard.downloadPdf') || 'Download PDF'}
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            const success = await handleDeleteReport(analysisResult.id);
                            if (success) {
                              setAnalysisResult(null);
                              setSelectedImage(null);
                              setCaptureData(null);
                            }
                          }}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold transition-all duration-300"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('common.delete') || 'Delete'}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setAnalysisResult(null);
                          setSelectedImage(null);
                          setCaptureData(null);
                          setUseCamera(false);
                          setError(null);
                          setIsAnalyzing(false);
                        }}
                        className="w-full text-sm text-gray-500 hover:text-[#10261C] transition-colors py-2 font-bold"
                      >
                        {t('result.fileAnother') || '← Start Over / File Another Claim'}
                      </button>
                    </div>
                  ) : selectedImage && captureData ? (
                    <div className="space-y-4 p-6 bg-[#FCFAF5] border border-[#E6DCC9] rounded-2xl text-center shadow-inner">
                      <div className={`relative max-w-[280px] mx-auto rounded-xl overflow-hidden transition-all duration-300 ${isAnalyzing ? 'scan-container scan-border scan-pulse' : ''}`}>
                        <img src={selectedImage} alt="Uploaded crop" className="max-h-48 w-full object-cover rounded-xl border border-[#E6DCC9]" />
                      </div>
                      <p className="text-green-800 font-bold">{t('dashboard.uploadSuccess')}</p>
                      <div className="mt-6 text-left">
                        <UploadForm
                          captureData={captureData}
                          onLoadingChange={(analyzing) => setIsAnalyzing(analyzing)}
                          onResult={(data) => {
                            console.log("AI RESPONSE", data);
                            const pdfUrl = data.pdf_url ? data.pdf_url.replace(/\\/g, '/') : null;
                            const newAssessment = {
                              id: data.claim_id || Date.now(),
                              cropName: data.damage_type || t('dashboard.cropAssessment'),
                              location: t('dashboard.farmField'),
                              date: new Date().toISOString().split('T')[0],
                              damagePercent: Number(data.damage_pct || 0).toFixed(1),
                              status: 'completed',
                              reportUrl: pdfUrl
                            };
                            setAnalysisResult(newAssessment);
                            setAssessments((prev) => [newAssessment, ...prev]);
                            setStats((prev) => ({
                              ...prev,
                              totalAssessments: prev.totalAssessments + 1,
                              recentReports: prev.recentReports + 1,
                              pendingAnalysis: 0,
                              accuracyRate: Math.round((data.confidence || 0) * 100)
                            }));
                          }}
                          onReset={() => {
                            setCaptureData(null);
                            setSelectedImage(null);
                            setAnalysisResult(null);
                            setUseCamera(false);
                            setError(null);
                            setIsAnalyzing(false);
                          }}
                        />
                      </div>
                    </div>
                  ) : useCamera ? (
                    <div className="p-4 rounded-xl bg-[#FCFAF5] border border-[#E6DCC9] shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[#10261C] font-bold text-sm">Live Camera Capture</span>
                        <button
                          onClick={() => {
                            setUseCamera(false);
                            setError(null);
                          }}
                          className="text-xs text-[#E88125] hover:text-[#cf6f1b] font-bold transition-colors"
                        >
                          Close Camera
                        </button>
                      </div>
                      <CameraCapture onCapture={handleCameraCapture} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      {/* Only Camera Capture is allowed to ensure real-time geotagging */}
                      <button
                        onClick={() => {
                          setUseCamera(true);
                          setError(null);
                        }}
                        className="w-full max-w-md group flex flex-col items-center justify-center p-10 rounded-2xl bg-[#FCFAF5] border-2 border-dashed border-[#E6DCC9] hover:border-[#E88125] hover:bg-white transition-all duration-300 text-center"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-[#E88125]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <ImageIcon className="w-8 h-8 text-[#E88125]" />
                        </div>
                        <span className="text-[#10261C] font-bold text-base mb-1">Capture Live Crop Photo</span>
                        <span className="text-gray-500 text-xs font-medium">Only live camera photos with active GPS coordinates are accepted</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Recent Assessments Table */}
                <div className="rounded-2xl p-6 bg-white border border-[#E6DCC9] shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                    <h2 className="text-xl font-bold text-[#10261C]">{t('dashboard.recentAssessments')}</h2>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg bg-[#FCFAF5] border border-[#E6DCC9] hover:border-[#E88125] transition-colors">
                        <Search className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 rounded-lg bg-[#FCFAF5] border border-[#E6DCC9] hover:border-[#E88125] transition-colors">
                        <Filter className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  <div id="reportsSection" className="overflow-x-auto font-medium">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-2 text-gray-500 font-semibold text-sm">{t('dashboard.crop')}</th>
                          <th className="text-left py-3 px-2 text-gray-500 font-semibold text-sm hidden sm:table-cell">{t('dashboard.location')}</th>
                          <th className="text-left py-3 px-2 text-gray-500 font-semibold text-sm hidden md:table-cell">{t('dashboard.date')}</th>
                          <th className="text-left py-3 px-2 text-gray-500 font-semibold text-sm">{t('dashboard.damage')}</th>
                          <th className="text-left py-3 px-2 text-gray-500 font-semibold text-sm">{t('dashboard.status')}</th>
                          <th className="text-left py-3 px-2 text-gray-500 font-semibold text-sm">{t('dashboard.action')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assessments.map((assessment) => (
                          <tr key={assessment.id} className="border-b border-gray-100 hover:bg-[#FCFAF5] transition-colors">
                            <td className="py-3 px-2">
                              <p className="text-[#10261C] font-semibold text-sm capitalize">{assessment.cropName}</p>
                            </td>
                            <td className="py-3 px-2 hidden sm:table-cell">
                              <p className="text-gray-600 text-sm">{assessment.location}</p>
                            </td>
                            <td className="py-3 px-2 hidden md:table-cell">
                              <p className="text-gray-500 text-sm">{assessment.date}</p>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${getDamageColor(parseFloat(assessment.damagePercent))}`}>
                                {assessment.damagePercent}%
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex items-center gap-1 text-xs font-bold ${assessment.status === 'completed' ? 'text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100' : 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100'}`}>
                                {assessment.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {assessment.status === 'completed' ? t('common.completed') : t('common.pending')}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleViewReport(assessment.id)}
                                  className="p-1.5 rounded-lg bg-gray-50 border border-[#E6DCC9] hover:bg-gray-100 transition-colors"
                                  title="View Report"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                </button>
                                {assessment.reportUrl && (
                                  <button 
                                    onClick={() => handleDownloadPDF(assessment.reportUrl)}
                                    className="p-1.5 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors"
                                    title="Download PDF"
                                  >
                                    <Download className="w-4 h-4 text-green-700" />
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleDeleteReport(assessment.id)}
                                  className="p-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                                  title="Delete Report"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Generate Report Button */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end font-medium">
                    <button 
                      onClick={() => handleGenerateReport('new')}
                      className="px-6 py-2.5 rounded-xl bg-[#E88125] text-white hover:bg-[#cf6f1b] font-bold transition-all duration-300 hover:shadow-md hover:scale-[1.01] flex items-center gap-2"
                    >
                      <FileCheck className="w-4 h-4" />
                      {t('dashboard.generateReport')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Quick Actions */}
              <div className="space-y-6">
                <div className="rounded-2xl p-6 bg-white border border-[#E6DCC9] shadow-sm">
                  <h2 className="text-xl font-bold text-[#10261C] mb-4">{t('dashboard.quickActions')}</h2>
                  
                  <div className="space-y-3">
                    <button onClick={() => { setUseCamera(true); setError(null); }} className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FCFAF5] border border-[#E6DCC9] hover:border-[#E88125] hover:bg-white transition-all duration-300 group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E88125]/10 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-[#E88125]"/>
                        </div>
                        <span className="text-[#10261C] font-semibold text-sm">Capture Live Crop</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#E88125] transition-colors"/>
                    </button>

                    <button onClick={()=>document.getElementById('reportsSection')?.scrollIntoView({behavior:'smooth'})} className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FCFAF5] border border-[#E6DCC9] hover:border-[#E88125] hover:bg-white transition-all duration-300 group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E88125]/10 flex items-center justify-center">
                          <Eye className="w-4 h-4 text-[#E88125]"/>
                        </div>
                        <span className="text-[#10261C] font-semibold text-sm">{t('dashboard.viewReports')}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#E88125] transition-colors"/>
                    </button>

                    <button onClick={()=>analysisResult?.reportUrl?window.open(normalizePdfUrl(analysisResult.reportUrl),'_blank'):alert(t('dashboard.generateFirst'))} className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FCFAF5] border border-[#E6DCC9] hover:border-[#E88125] hover:bg-white transition-all duration-300 group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#E88125]/10 flex items-center justify-center">
                          <Download className="w-4 h-4 text-[#E88125]"/>
                        </div>
                        <span className="text-[#10261C] font-semibold text-sm">{t('dashboard.downloadPdf')}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#E88125] transition-colors"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BimaSetuDashboard;