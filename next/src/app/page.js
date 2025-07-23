'use client';  // Important: enable client-side hooks in App Router

import { useState, useRef, useEffect, useCallback } from 'react';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [isHovered, setIsHovered] = useState(false);
  
  // Focus states for floating labels
  const [focus, setFocus] = useState({ username: false, email: false, password: false, confirmPassword: false });
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // New state for the welcome page
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = w-64
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Project Alpha',
      pages: [
        { 
          id: 1, 
          name: 'Home Page',
          tabs: [
            { id: 1, name: 'Design Tables', type: 'Design Tables', active: true }
          ]
        }
      ],
      expanded: false
    },
    {
      id: 2,
      name: 'Project Beta',
      pages: [
        { 
          id: 2, 
          name: 'Dashboard',
          tabs: [
            { id: 2, name: 'Design Tables', type: 'Design Tables', active: true }
          ]
        }
      ],
      expanded: false
    }
  ]);
  const [selectedPage, setSelectedPage] = useState({ projectId: 1, pageId: 1 });
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: '', itemId: null });
  const [editingItem, setEditingItem] = useState({ type: '', id: null, name: '' });

  // Add state for seismic template fields per tab
  const [seismicTabData, setSeismicTabData] = useState({});

  // Add state for sediment types data
  const [sedimentTypes, setSedimentTypes] = useState([]);
  const [loadingSediments, setLoadingSediments] = useState(false);
  const [sedimentError, setSedimentError] = useState('');

  // Add state for Flask API results
  const [seismicResult, setSeismicResult] = useState(null);

  // Add fetchSedimentTypes function
  const fetchSedimentTypes = async () => {
    setLoadingSediments(true);
    setSedimentError("");
    try {
      const res = await fetch("http://localhost:8080/api/sediment-types");
      if (!res.ok) throw new Error("Failed to fetch sediment types");
      const data = await res.json();
      setSedimentTypes(data);
    } catch (err) {
      setSedimentError("Error fetching sediment types from backend.");
      setSedimentTypes([]);
    } finally {
      setLoadingSediments(false);
    }
  };

  // Move these above the useEffect that uses them, and use useCallback for stable references
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth >= 200 && newWidth <= 500) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.show) {
        setContextMenu({ show: false, x: 0, y: 0, type: '', itemId: null });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.show]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || (!isLogin && (!username || !confirmPassword))) {
      setErrorMessage('Please fill in all fields.');
      setShowErrorDialog(true);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setShowErrorDialog(true);
      return;
    }

    const endpoint = isLogin ? 'login' : 'register';

    try {
      const res = await fetch(`/api/users/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (isLogin) {
          // Note: localStorage usage - this may not work in all environments
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('token', data.token);
          }
          setIsAuthenticated(true);
          setUsername(data.username || username);
          setShowForm(false);
          setErrorMessage('');
        } else {
          setErrorMessage('Registration successful! Please log in.');
          setShowErrorDialog(true);
          setIsLogin(true);
        }
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(data.message || 'An error occurred.');
        setShowErrorDialog(true);
      }
    } catch (err) {
      setErrorMessage('Server error. Please try again.');
      setShowErrorDialog(true);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
    }
    setIsAuthenticated(false);
    setUsername('');
  };

  // Project management functions
  const addProject = () => {
    const newProject = {
      id: Date.now(),
      name: `New Project ${projects.length + 1}`,
      pages: [],
      expanded: false
    };
    setProjects([...projects, newProject]);
  };

  const addPage = (projectId) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        const newPageId = Date.now();
        return {
          ...project,
          pages: [...project.pages, { 
            id: newPageId, 
            name: `New Page ${project.pages.length + 1}`,
            tabs: [
              { id: Date.now(), name: 'Design Tables', type: 'Design Tables', active: true }
            ]
          }]
        };
      }
      return project;
    });
    setProjects(updatedProjects);
  };

  const toggleProjectExpansion = (projectId) => {
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return { ...project, expanded: !project.expanded };
      }
      return project;
    });
    setProjects(updatedProjects);
  };

  const handleProjectContextMenu = (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, type: 'project', itemId: projectId });
  };

  const handlePageContextMenu = (e, projectId, pageId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, type: 'page', itemId: { projectId, pageId } });
  };

  const handleContextMenuAction = (action) => {
    const { type, itemId } = contextMenu;
    
    if (type === 'project') {
      const projectId = itemId;
      const project = projects.find(p => p.id === projectId);
      
      switch (action) {
        case 'rename':
          setEditingItem({ type: 'project', id: projectId, name: project.name });
          break;
        case 'copy':
          const copiedProject = {
            ...project,
            id: Date.now(),
            name: `${project.name} (Copy)`,
            pages: project.pages.map(page => ({ ...page, id: Date.now() + Math.random() })),
            expanded: false
          };
          setProjects([...projects, copiedProject]);
          break;
        case 'delete':
          setProjects(projects.filter(p => p.id !== projectId));
          break;
        case 'newPage':
          addPage(projectId);
          break;
      }
    } else if (type === 'page') {
      const { projectId, pageId } = itemId;
      const project = projects.find(p => p.id === projectId);
      const page = project.pages.find(p => p.id === pageId);
      
      switch (action) {
        case 'rename':
          setEditingItem({ type: 'page', id: { projectId, pageId }, name: page.name });
          break;
        case 'copy':
          const updatedProjects = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: [...p.pages, { ...page, id: Date.now(), name: `${page.name} (Copy)` }]
              };
            }
            return p;
          });
          setProjects(updatedProjects);
          break;
        case 'delete':
          const projectsAfterDelete = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: p.pages.filter(page => page.id !== pageId)
              };
            }
            return p;
          });
          setProjects(projectsAfterDelete);
          break;
      }
    } else if (type === 'tab') {
      const tabId = itemId;
      const { projectId, pageId } = selectedPage;
      const project = projects.find(p => p.id === projectId);
      const page = project.pages.find(p => p.id === pageId);
      const tab = page.tabs.find(t => t.id === tabId);
      
      switch (action) {
        case 'copy':
          const updatedProjects = projects.map(p => {
            if (p.id === projectId) {
              return {
                ...p,
                pages: p.pages.map(pa => {
                  if (pa.id === pageId) {
                    const copiedTab = {
                      ...tab,
                      id: Date.now(),
                      name: `${tab.name} (Copy)`,
                      active: false
                    };
                    return {
                      ...pa,
                      tabs: [...pa.tabs, copiedTab]
                    };
                  }
                  return pa;
                })
              };
            }
            return p;
          });
          setProjects(updatedProjects);
          break;
      }
    }
    
    setContextMenu({ show: false, x: 0, y: 0, type: '', itemId: null });
  };

  const handleEditSave = (newName) => {
    if (editingItem.type === 'project') {
      const updatedProjects = projects.map(project => {
        if (project.id === editingItem.id) {
          return { ...project, name: newName };
        }
        return project;
      });
      setProjects(updatedProjects);
    } else if (editingItem.type === 'page') {
      const { projectId, pageId } = editingItem.id;
      const updatedProjects = projects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            pages: project.pages.map(page => {
              if (page.id === pageId) {
                return { ...page, name: newName };
              }
              return page;
            })
          };
        }
        return project;
      });
      setProjects(updatedProjects);
    }
    setEditingItem({ type: '', id: null, name: '' });
  };

  const handleEditCancel = () => {
    setEditingItem({ type: '', id: null, name: '' });
  };

  // Tab management functions
  const addTab = () => {
    const { projectId, pageId } = selectedPage;
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          pages: project.pages.map(page => {
            if (page.id === pageId) {
              const newTab = {
                id: Date.now(),
                name: 'Design Tables',
                type: 'Design Tables',
                active: false
              };
              return {
                ...page,
                tabs: [...page.tabs, newTab]
              };
            }
            return page;
          })
        };
      }
      return project;
    });
    setProjects(updatedProjects);
  };

  const closeTab = (tabId) => {
    const { projectId, pageId } = selectedPage;
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          pages: project.pages.map(page => {
            if (page.id === pageId) {
              if (page.tabs.length > 1) {
                return {
                  ...page,
                  tabs: page.tabs.filter(tab => tab.id !== tabId)
                };
              }
            }
            return page;
          })
        };
      }
      return project;
    });
    setProjects(updatedProjects);
  };

  const selectTab = (tabId) => {
    const { projectId, pageId } = selectedPage;
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          pages: project.pages.map(page => {
            if (page.id === pageId) {
              return {
                ...page,
                tabs: page.tabs.map(tab => ({
                  ...tab,
                  active: tab.id === tabId
                }))
              };
            }
            return page;
          })
        };
      }
      return project;
    });
    setProjects(updatedProjects);
  };

  const selectPage = (projectId, pageId) => {
    setSelectedPage({ projectId, pageId });
  };

  const handleTabContextMenu = (e, tabId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, type: 'tab', itemId: tabId });
  };

  const handleTabTypeChange = (tabId, newType) => {
    const { projectId, pageId } = selectedPage;
    const updatedProjects = projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          pages: project.pages.map(page => {
            if (page.id === pageId) {
              return {
                ...page,
                tabs: page.tabs.map(tab => {
                  if (tab.id === tabId) {
                    return { ...tab, name: newType, type: newType };
                  }
                  return tab;
                })
              };
            }
            return page;
          })
        };
      }
      return project;
    });
    setProjects(updatedProjects);
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-white">
          {/* Top bar */}
          <div className="flex justify-between items-center p-6 max-w-7xl mx-auto">
            <span className="text-xl font-semibold">
              Welcome to Our Platform
            </span>
            <div>
              <button
                onClick={() => setShowForm(true)}
                className="rounded bg-yellow-100 px-4 py-2 hover:bg-yellow-200 transition flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} className="text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Start now</span>
              </button>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex items-center justify-center px-6 py-12">
            {showForm ? (
              <div style={{ width: '320px', maxWidth: '320px' }} className="mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
                  {isLogin ? 'Sign In' : 'Register'}
                </h2>
                
                <div className="bg-gray-50 rounded-lg p-8 overflow-visible" style={{ width: '100%' }}>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {!isLogin && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(focus.username || username) && (
                          <label className="block text-xs text-blue-600 font-medium transition-all duration-200">
                            Username
                          </label>
                        )}
                        <input
                          type="text"
                          placeholder={(!focus.username && !username) ? 'Enter your username' : ''}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onFocus={() => setFocus(f => ({ ...f, username: true }))}
                          onBlur={() => setFocus(f => ({ ...f, username: false }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                          style={{ width: '100%', boxSizing: 'border-box', height: '48px' }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(focus.email || email) && (
                        <label className="block text-xs text-blue-600 font-medium transition-all duration-200">
                          Email Address
                        </label>
                      )}
                      <input
                        type="email"
                        placeholder={(!focus.email && !email) ? 'Enter your email' : ''}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocus(f => ({ ...f, email: true }))}
                        onBlur={() => setFocus(f => ({ ...f, email: false }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                        style={{ width: '100%', boxSizing: 'border-box', height: '48px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(focus.password || password) && (
                        <label className="block text-xs text-blue-600 font-medium transition-all duration-200">
                          Password
                        </label>
                      )}
                      <input
                        type="password"
                        placeholder={(!focus.password && !password) ? 'Enter your password' : ''}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocus(f => ({ ...f, password: true }))}
                        onBlur={() => setFocus(f => ({ ...f, password: false }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                        style={{ width: '100%', boxSizing: 'border-box', height: '48px' }}
                      />
                    </div>

                    {!isLogin && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(focus.confirmPassword || confirmPassword) && (
                          <label className="block text-xs text-blue-600 font-medium transition-all duration-200">
                            Confirm Password
                          </label>
                        )}
                        <input
                          type="password"
                          placeholder={(!focus.confirmPassword && !confirmPassword) ? 'Confirm your password' : ''}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onFocus={() => setFocus(f => ({ ...f, confirmPassword: true }))}
                          onBlur={() => setFocus(f => ({ ...f, confirmPassword: false }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
                          style={{ width: '100%', boxSizing: 'border-box', height: '48px' }}
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                      // not working tailwind classes: color classes. round-corner class
                      className="w-full hover:bg-blue-900 font-medium text-sm flex items-center justify-center space-x-2"
                      style={{ 
                        border: '1px solid #2563eb', 
                        height: '48px',
                        backgroundColor: isHovered ? '#1d4ed8' : '#2563eb', // #2563eb = blue-600
                        color: '#ffffff', // Force white text
                        borderRadius: '0.375rem'
                      }}
                    >
                      <svg style={{ width: '14px', height: '14px' }} className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>{isLogin ? 'Sign In' : 'Register'}</span>
                    </button>
                  </form>

                  {/* Action buttons */}
                  <div style={{ marginTop: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {isLogin ? (
                      <>
                        {/* Login page: Two buttons in same line */}
                        <div className="w-full max-w-md mx-auto flex gap-4 mt-2">
                          <button
                            onClick={() => {
                              setIsLogin(!isLogin);
                              setErrorMessage('');
                            }}
                            className="w-1/2 h-12 bg-white border border-gray-200 rounded-md font-medium flex items-center justify-center hover:bg-gray-50 transition space-x-2"
                            type="button"
                          >
                            <svg style={{ width: '16px', height: '16px' }} className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Need to register?</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setErrorMessage('Forgot password functionality coming soon!');
                            }}
                            className="w-1/2 h-12 bg-white border border-gray-200 rounded-md font-medium flex items-center justify-center hover:bg-gray-50 transition space-x-2"
                            type="button"
                          >
                            <svg style={{ width: '16px', height: '16px' }} className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span>Forgot Password</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Register page: Full width button */}
                        <button
                          onClick={() => {
                            setIsLogin(!isLogin);
                            setErrorMessage('');
                          }}
                          className="w-full bg-white text-blue-600 flex items-center justify-center gap-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200 font-medium text-sm"
                          style={{ height: '48px' }}
                        >
                          <svg style={{ width: '12px', height: '12px' }} className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span>Have an account?</span>
                        </button>
                      </>
                    )}

                    {/* Language selector */}
                    <div className="pt-2 flex justify-center">
                      <button className="bg-white text-gray-500 text-xs flex items-center gap-1 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200"
                        style={{ height: '48px', padding: '0 16px' }}>
                        <svg style={{ width: '12px', height: '12px' }} className="text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>EN</span>
                        <svg style={{ width: '8px', height: '8px' }} className="text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Cancel button */}
                    <div className="pt-2 flex justify-center">
                      <button
                        onClick={() => {
                          setShowForm(false);
                          setErrorMessage('');
                        }}
                        className="bg-white text-gray-500 text-xs flex items-center gap-1 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200"
                        style={{ height: '48px', padding: '0 16px' }}
                      >
                        <svg style={{ width: '12px', height: '12px' }} className="text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome to Our Platform
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Please sign in or register to continue
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition flex items-center space-x-2 mx-auto"
                >
                  <svg style={{ width: '18px', height: '18px' }} className="text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Get Started</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {showErrorDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Message</h3>
                <button
                  onClick={() => setShowErrorDialog(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-700 mb-4">{errorMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowErrorDialog(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Welcome page after authentication
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Area */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-xl font-semibold text-gray-800">ProjectHub</span>
        </div>

        {/* Center - Empty space */}
        <div className="flex-1"></div>

        {/* Right side - Language, Settings, Logout */}
        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-gray-800 transition p-2 rounded hover:bg-gray-100" title="Language">
            <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </button>
          <button className="text-gray-600 hover:text-gray-800 transition p-2 rounded hover:bg-gray-100" title="Settings">
            <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button 
            onClick={logout}
            className="text-gray-600 hover:text-gray-800 transition p-2 rounded hover:bg-gray-100"
            title="Logout"
          >
            <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Task Area */}
      <div className="flex-1 flex">
        {/* Project Sidebar */}
        <div 
          ref={sidebarRef}
          className={`bg-white border-r border-gray-200 transition-all duration-300 relative ${sidebarCollapsed ? 'w-12' : ''}`}
          style={{ width: sidebarCollapsed ? '48px' : `${sidebarWidth}px` }}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            {!sidebarCollapsed && <span className="font-semibold text-gray-800">Projects</span>}
            <div className="flex items-center space-x-2">
              {!sidebarCollapsed && (
                <button
                  onClick={addProject}
                  className="p-1 rounded hover:bg-blue-100 transition bg-blue-50"
                  title="New Project"
                >
                  <svg style={{ width: '14px', height: '14px' }} className="text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 rounded hover:bg-gray-100 transition bg-gray-50"
                title={sidebarCollapsed ? "Expand" : "Collapse"}
              >
                <svg style={{ width: '14px', height: '14px' }} className={`text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          {!sidebarCollapsed && (
            <div className="p-2">
              {projects.map(project => (
                <div key={project.id} className="mb-2">
                  <div
                    className="flex items-center justify-between p-2 rounded hover:bg-blue-50 cursor-pointer group"
                    onClick={() => toggleProjectExpansion(project.id)}
                    onContextMenu={(e) => handleProjectContextMenu(e, project.id)}
                  >
                    <div className="flex items-center">
                      {project.pages.length > 0 && (
                        <svg 
                          style={{ width: '12px', height: '12px' }} 
                          className={`text-gray-500 mr-2 transition-transform ${project.expanded ? 'rotate-90' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                      <svg style={{ width: '14px', height: '14px' }} className="text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {editingItem.type === 'project' && editingItem.id === project.id ? (
                        <input
                          type="text"
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          onBlur={() => handleEditSave(editingItem.name)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditSave(editingItem.name);
                            } else if (e.key === 'Escape') {
                              handleEditCancel();
                            }
                          }}
                          className="text-sm text-gray-700 bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{project.name}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addPage(project.id);
                      }}
                      className="p-1 rounded hover:bg-green-100 transition opacity-0 group-hover:opacity-100 bg-green-50"
                      title="Add Page"
                    >
                      <svg style={{ width: '12px', height: '12px' }} className="text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Project Pages */}
                  {project.expanded && (
                    <div className="ml-6 space-y-1">
                      {project.pages.map((page, index) => (
                        <div
                          key={page.id}
                          className={`flex items-center p-1.5 rounded hover:bg-green-50 cursor-pointer ${
                            selectedPage.projectId === project.id && selectedPage.pageId === page.id 
                              ? 'bg-green-100 border border-green-300' 
                              : ''
                          }`}
                          onClick={() => selectPage(project.id, page.id)}
                          onContextMenu={(e) => handlePageContextMenu(e, project.id, page.id)}
                          style={{ marginLeft: '20px' }}
                        >
                          <svg style={{ width: '12px', height: '12px' }} className="text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {editingItem.type === 'page' && editingItem.id.projectId === project.id && editingItem.id.pageId === page.id ? (
                            <input
                              type="text"
                              value={editingItem.name}
                              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                              onBlur={() => handleEditSave(editingItem.name)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditSave(editingItem.name);
                                } else if (e.key === 'Escape') {
                                  handleEditCancel();
                                }
                              }}
                              className="text-xs text-gray-600 bg-white border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500 flex-1"
                              autoFocus
                            />
                          ) : (
                            <span className="text-xs text-gray-600 flex-1">{page.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Resize Handle */}
          {!sidebarCollapsed && (
            <div
              className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors z-10 bg-gray-200"
              onMouseDown={handleMouseDown}
              style={{ 
                cursor: isResizing ? 'col-resize' : 'col-resize',
                background: isResizing ? '#3B82F6' : '#e5e7eb'
              }}
            />
          )}
        </div>

        {/* Information Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="bg-white border-b border-gray-200 flex items-center">
            {/* Tabs */}
            <div className="flex items-center border-b border-gray-200 bg-white">
              <div className="flex-1 flex">
                {(() => {
                  const currentProject = projects.find(p => p.id === selectedPage.projectId);
                  const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                  const currentTabs = currentPage?.tabs || [];
                  
                  return currentTabs.map(tab => (
                    <div
                      key={tab.id}
                      className={`flex items-center px-4 py-2 border-r border-gray-200 cursor-pointer group ${
                        tab.active ? 'bg-blue-50 border-b-2 border-blue-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => selectTab(tab.id)}
                      onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
                    >
                      <span className="text-sm text-gray-700 mr-2">{tab.name}</span>
                      {currentTabs.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                          }}
                          className="ml-2 p-1 rounded hover:bg-red-100 transition opacity-0 group-hover:opacity-100 bg-red-50"
                          title="Close Tab"
                        >
                          <svg style={{ width: '10px', height: '10px' }} className="text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ));
                })()}
              </div>
              <button
                onClick={addTab}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-blue-100 transition bg-blue-50"
                title="Add Tab"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                  <svg style={{ width: '16px', height: '16px' }} className="text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{(() => {
                    const currentProject = projects.find(p => p.id === selectedPage.projectId);
                    const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                    const activeTab = currentPage?.tabs.find(t => t.active);
                    return activeTab?.name || 'Design Tables';
                  })()}</span>
                </h2>
                <select 
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm flex items-center space-x-2 bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors"
                  value={(() => {
                    const currentProject = projects.find(p => p.id === selectedPage.projectId);
                    const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                    const activeTab = currentPage?.tabs.find(t => t.active);
                    return activeTab?.type || 'Design Tables';
                  })()}
                  onChange={(e) => {
                    const currentProject = projects.find(p => p.id === selectedPage.projectId);
                    const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                    const activeTab = currentPage?.tabs.find(t => t.active);
                    if (activeTab) {
                      handleTabTypeChange(activeTab.id, e.target.value);
                    }
                  }}
                >
                  <option>Design Tables</option>
                  <option>Snow Load</option>
                  <option>Wind Load</option>
                  <option>Seismic Template</option>
                </select>
              </div>
              
              <div className="text-gray-600">
                {(() => {
                  const currentProject = projects.find(p => p.id === selectedPage.projectId);
                  const currentPage = currentProject?.pages.find(p => p.id === selectedPage.pageId);
                  const activeTab = currentPage?.tabs.find(t => t.active);
                  if (activeTab?.type === 'Seismic Template') {
                    // Unique key for this tab
                    const tabKey = `${selectedPage.projectId}_${selectedPage.pageId}_${activeTab.id}`;
                    const data = seismicTabData[tabKey] || {
                      designer: '',
                      address: '',
                      project: '',
                      revision: '',
                      date: '',
                      bldgCode: '',
                      apiKey: ''
                    };
                    const handleChange = (field, value) => {
                      setSeismicTabData(prev => ({
                        ...prev,
                        [tabKey]: {
                          ...prev[tabKey],
                          [field]: value
                        }
                      }));
                    };
                    return (
                      <div className="max-w-md mx-auto bg-orange-100 rounded-lg p-4 border border-orange-200">
                        <div className="grid grid-cols-2 gap-2 items-center text-purple-700 text-base font-medium">
                          <div className="text-right pr-2">Designer</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.designer || ''} onChange={e => handleChange('designer', e.target.value)} />
                          <div className="text-right pr-2">Address</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.address || ''} onChange={e => handleChange('address', e.target.value)} placeholder="Enter the address" />
                          <div className="text-right pr-2">Project #</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.project || ''} onChange={e => handleChange('project', e.target.value)} />
                          <div className="text-right pr-2">Revision</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.revision || ''} onChange={e => handleChange('revision', e.target.value)} />
                          <div className="text-right pr-2">Date</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.date || ''} onChange={e => handleChange('date', e.target.value)} />
                          <div className="text-right pr-2">Bldg code</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.bldgCode || ''} onChange={e => handleChange('bldgCode', e.target.value)} />
                          <div className="text-right pr-2">Api_key</div>
                          <input className="bg-orange-50 rounded px-2 py-1" value={data.apiKey || ''} onChange={e => handleChange('apiKey', e.target.value)} placeholder="Enter your API key" />
                        </div>
                        {/* Retrieve Data Button */}
                        <div className="flex justify-center mt-6">
                          <button
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                            style={{ minWidth: '180px' }}
                            onClick={async () => {
                              setSedimentError("");
                              setSeismicResult(null);
                              if (!data.address || !data.apiKey) {
                                setSedimentError("Address and API key are required.");
                                return;
                              }
                              let currentSedimentTypes = sedimentTypes;
                              if (currentSedimentTypes.length === 0) {
                                try {
                                  setLoadingSediments(true);
                                  const res = await fetch("http://localhost:8080/api/sediment-types");
                                  if (!res.ok) throw new Error("Failed to fetch sediment types");
                                  currentSedimentTypes = await res.json();
                                  setSedimentTypes(currentSedimentTypes);
                                } catch (err) {
                                  setSedimentError("Error fetching sediment types from backend.");
                                  setSedimentTypes([]);
                                  setLoadingSediments(false);
                                  return;
                                }
                              }
                              setLoadingSediments(true);
                              try {
                                const res = await fetch('http://localhost:5001/api/seismic-info', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    address: data.address,
                                    api_key: data.apiKey,
                                    soil_table: currentSedimentTypes
                                  })
                                });
                                if (!res.ok) throw new Error('Failed to fetch seismic info');
                                const result = await res.json();
                                setSeismicResult(result);
                                // Optionally update sedimentTypes with probabilities
                                if (result.most_similar_soil && result.rgb && currentSedimentTypes.length > 0) {
                                  const rgb = result.rgb;
                                  const probs = currentSedimentTypes.map(row => {
                                    const soil_rgb = [row.color_r, row.color_g, row.color_b];
                                    // Cosine similarity
                                    const dot = rgb[0]*soil_rgb[0] + rgb[1]*soil_rgb[1] + rgb[2]*soil_rgb[2];
                                    const norm1 = Math.sqrt(rgb[0]**2 + rgb[1]**2 + rgb[2]**2);
                                    const norm2 = Math.sqrt(soil_rgb[0]**2 + soil_rgb[1]**2 + soil_rgb[2]**2);
                                    return norm1 && norm2 ? dot/(norm1*norm2) : 0;
                                  });
                                  setSedimentTypes(currentSedimentTypes.map((row, i) => ({ ...row, probability: probs[i] })));
                                }
                              } catch (err) {
                                setSedimentError('Error retrieving data.');
                                setSeismicResult(null);
                              } finally {
                                setLoadingSediments(false);
                              }
                            }}
                          >
                            {loadingSediments ? 'Loading...' : 'Retrieve Data'}
                          </button>
                          <button
                            className="bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-500 transition ml-4"
                            style={{ minWidth: '120px' }}
                            onClick={() => {
                              setSeismicResult(null);
                              setSedimentError("");
                              // Clear the fields for the current tab
                              setSeismicTabData(prev => ({
                                ...prev,
                                [tabKey]: {
                                  designer: '',
                                  address: '',
                                  project: '',
                                  revision: '',
                                  date: '',
                                  bldgCode: '',
                                  apiKey: ''
                                }
                              }));
                            }}
                          >
                            Clear Data
                          </button>
                        </div>
                        {/* After the Retrieve Data button and before the sedimentTypes table, render the new info and seismic hazard table: */}
                        {seismicResult && (
                          <div className="mt-6">
                            <div className="mb-2 text-sm">
                              <div><b>address_checked:</b> {seismicResult.address_checked}</div>
                              <div><b>site_class:</b> {seismicResult.site_class}</div>
                              <div><b>longitude:</b> {seismicResult.coordinates?.lon}</div>
                              <div><b>latitude:</b> {seismicResult.coordinates?.lat}</div>
                            </div>
                            {/* Seismic Hazard Table */}
                            <div className="overflow-x-auto mb-4">
                              <table className="min-w-full text-xs text-center border border-gray-300 bg-white rounded">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="px-2 py-1 border">T (s)</th>
                                    <th className="px-2 py-1 border">Sa(T,X)</th>
                                    <th className="px-2 py-1 border">Sa(T,X450)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {['0.2','0.5','1.0','2.0','5.0','10.0','PGA'].map((T, i) => (
                                    <tr key={T}>
                                      <td className="border px-2 py-1">{T}</td>
                                      <td className="border px-2 py-1">{seismicResult.sa_site ? seismicResult.sa_site[i] : ''}</td>
                                      <td className="border px-2 py-1">{seismicResult.sa_x450 ? seismicResult.sa_x450[i] : ''}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {/* Sediment Types Table */}
                        <div className="mt-6">
                          {(() => {
                            const showProbability = seismicResult && seismicResult.rgb;
                            return (
                              <>
                                {sedimentError && <div className="text-red-600 text-center mb-2">{sedimentError}</div>}
                                {seismicResult && sedimentTypes.length > 0 && (
                                  <div className="overflow-x-auto mt-6">
                                    <table className="min-w-full text-xs text-center border border-gray-300 bg-white rounded">
                                      <thead className="bg-gray-200 font-bold">
                                        <tr>
                                          <th className="px-2 py-1 border">Type</th>
                                          <th className="px-2 py-1 border">Sediments</th>
                                          <th className="px-2 py-1 border">Site Class</th>
                                          <th className="px-2 py-1 border">Soil Pressure(psf)</th>
                                          <th className="px-2 py-1 border">Colour</th>
                                          <th className="px-2 py-1 border">R</th>
                                          <th className="px-2 py-1 border">G</th>
                                          <th className="px-2 py-1 border">B</th>
                                          {showProbability && <th className="px-2 py-1 border">Probability</th>}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sedimentTypes.map((row) => (
                                          <tr key={row.id}>
                                            <td className="border px-2 py-1">{row.id}</td>
                                            <td className="border px-2 py-1">{row.sediment_name}</td>
                                            <td className="border px-2 py-1">{row.site_class}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{row.soil_pressure_psf}</td>
                                            <td className="border px-2 py-1">
                                              <span style={{
                                                display: 'inline-block',
                                                width: '32px',
                                                height: '20px',
                                                borderRadius: '4px',
                                                backgroundColor: `rgb(${row.color_r},${row.color_g},${row.color_b})`,
                                                border: '1px solid #ccc'
                                              }} />
                                            </td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{row.color_r}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{row.color_g}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{row.color_b}</td>
                                            {showProbability && <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{row.probability !== undefined ? (row.probability*100).toFixed(3) + '%' : ''}</td>}
                                          </tr>
                                        ))}
                                        {showProbability && seismicResult && seismicResult.most_similar_soil && (
                                          <tr style={{ color: 'red', fontWeight: 'bold', background: '#ffe4b2' }}>
                                            <td className="border px-2 py-1">Result</td>
                                            <td className="border px-2 py-1">{seismicResult.most_similar_soil.sediment_name}</td>
                                            <td className="border px-2 py-1">{seismicResult.most_similar_soil.site_class}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{seismicResult.most_similar_soil.soil_pressure_psf}</td>
                                            <td className="border px-2 py-1">
                                              <span style={{
                                                display: 'inline-block',
                                                width: '32px',
                                                height: '20px',
                                                borderRadius: '4px',
                                                backgroundColor: `rgb(${seismicResult.most_similar_soil.color_r},${seismicResult.most_similar_soil.color_g},${seismicResult.most_similar_soil.color_b})`,
                                                border: '1px solid #ccc'
                                              }} />
                                            </td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{seismicResult.most_similar_soil.color_r}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{seismicResult.most_similar_soil.color_g}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{seismicResult.most_similar_soil.color_b}</td>
                                            <td className="border px-2 py-1" style={{ textAlign: 'right' }}>{(() => {
                                              if (!sedimentTypes.length) return '';
                                              const rgb = seismicResult.rgb;
                                              const soil_rgb = [seismicResult.most_similar_soil.color_r, seismicResult.most_similar_soil.color_g, seismicResult.most_similar_soil.color_b];
                                              const dot = rgb[0]*soil_rgb[0] + rgb[1]*soil_rgb[1] + rgb[2]*soil_rgb[2];
                                              const norm1 = Math.sqrt(rgb[0]**2 + rgb[1]**2 + rgb[2]**2);
                                              const norm2 = Math.sqrt(soil_rgb[0]**2 + soil_rgb[1]**2 + soil_rgb[2]**2);
                                              return norm1 && norm2 ? (dot/(norm1*norm2)*100).toFixed(3) + '%' : '';
                                            })()}</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  }
                  // Default content for other tabs
                  return (
                    <>
                      <p>Welcome to the {activeTab?.name || 'Design Tables'} workspace.</p>
                      <p className="mt-2">This is where you can manage your project information and calculations.</p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'project' && (
            <>
              <button
                onClick={() => handleContextMenuAction('rename')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Rename</span>
              </button>
              <button
                onClick={() => handleContextMenuAction('copy')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
              <button
                onClick={() => handleContextMenuAction('delete')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
              <button
                onClick={() => handleContextMenuAction('newPage')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Page</span>
              </button>
            </>
          )}
          
          {contextMenu.type === 'page' && (
            <>
              <button
                onClick={() => handleContextMenuAction('rename')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Rename</span>
              </button>
              <button
                onClick={() => handleContextMenuAction('copy')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
              <button
                onClick={() => handleContextMenuAction('delete')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
            </>
          )}
          
          {contextMenu.type === 'tab' && (
            <>
              <button
                onClick={() => handleContextMenuAction('copy')}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
              >
                <svg style={{ width: '14px', height: '14px' }} className="text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}