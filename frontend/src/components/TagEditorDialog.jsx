import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Chip, Box, Typography, CircularProgress, Divider,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const CATEGORY_LABELS = {
  access: 'Access',
  approach: 'Approach',
  quality: 'Quality',
  heritage: 'Heritage',
};

const TagEditorDialog = ({ gysId, pointName, open, onClose, onSaved }) => {
  const [allTags, setAllTags] = useState([]);
  const [activeSlugs, setActiveSlugs] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(new Set());

  const refresh = useCallback(async () => {
    if (!gysId) return;
    setLoading(true);
    try {
      const [tagsRes, pointTagsRes] = await Promise.all([
        apiClient.get('/api/admin/tags'),
        apiClient.get(`/api/admin/points/${gysId}/tags`),
      ]);
      setAllTags(tagsRes.data);
      setActiveSlugs(new Set(pointTagsRes.data.map(t => t.slug)));
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setLoading(false);
    }
  }, [gysId]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const toggle = async (slug) => {
    if (pending.has(slug)) return;
    const next = new Set(pending); next.add(slug); setPending(next);
    const isActive = activeSlugs.has(slug);
    try {
      if (isActive) {
        await apiClient.delete(`/api/admin/points/${gysId}/tags/${encodeURIComponent(slug)}`);
        const ns = new Set(activeSlugs); ns.delete(slug); setActiveSlugs(ns);
      } else {
        await apiClient.post(`/api/admin/points/${gysId}/tags`, { slug });
        const ns = new Set(activeSlugs); ns.add(slug); setActiveSlugs(ns);
      }
      onSaved && onSaved();
    } catch (err) {
      console.error('Tag toggle failed:', err);
      alert('Failed to update tag.');
    } finally {
      const np = new Set(pending); np.delete(slug); setPending(np);
    }
  };

  const grouped = allTags.reduce((acc, tag) => {
    (acc[tag.category] = acc[tag.category] || []).push(tag);
    return acc;
  }, {});

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit tags
        {pointName && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            GYS {gysId} — {pointName}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          Object.keys(CATEGORY_LABELS).map((cat, i) => (
            grouped[cat] && (
              <Box key={cat} sx={{ mb: 2 }}>
                {i > 0 && <Divider sx={{ mb: 2 }} />}
                <Typography variant="overline" color="text.secondary">
                  {CATEGORY_LABELS[cat]}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.5 }}>
                  {grouped[cat].map(tag => {
                    const active = activeSlugs.has(tag.slug);
                    const busy = pending.has(tag.slug);
                    return (
                      <Chip
                        key={tag.slug}
                        label={tag.label_en}
                        icon={tag.is_warning ? <WarningAmberIcon /> : undefined}
                        color={active ? (tag.is_warning ? 'warning' : 'primary') : 'default'}
                        variant={active ? 'filled' : 'outlined'}
                        onClick={() => toggle(tag.slug)}
                        disabled={busy}
                        sx={{ opacity: busy ? 0.5 : 1 }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )
          ))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TagEditorDialog;
