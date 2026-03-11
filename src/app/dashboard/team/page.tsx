'use client';

import React, { useEffect, useState } from 'react';
import { getTeamMembers, inviteMember } from '@/lib/server/team.actions';
import {
  Users,
  UserPlus,
  Shield,
  Loader2,
  MoreHorizontal,
  CheckCircle2,
  HardHat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const fetchTeam = async () => {
    setIsLoading(true);
    const res = await getTeamMembers();
    if (res.members) setMembers(res.members);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as any;

    const res = await inviteMember(email, name, role);
    if (res.success) {
      setInviteSuccess(true);
      fetchTeam();
    }
    setIsSubmitting(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'chef_projet': return 'secondary';
      case 'superviseur': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-semibold tracking-tight text-foreground sm:text-size-3xl">Équipe Admin</h1>
          <p className="hidden text-size-xs font-medium text-muted-foreground sm:block">Gérez les accès et les collaborateurs.</p>
        </div>
        <Button size="sm" onClick={() => {
          setInviteSuccess(false);
          setIsInviteModalOpen(true);
        }}>
          <UserPlus className="mr-2 h-4 w-4" />
          Inviter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Total</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-size-xl font-semibold sm:text-size-2xl">{members.length}</div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Admins</span>
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="text-size-xl font-semibold sm:text-size-2xl">
            {members.filter((m) => m.role === 'admin').length}
          </div>
        </Card>
        <Card className="hidden lg:block p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Superviseurs</span>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-size-2xl font-semibold">
            {members.filter((m) => m.role === 'superviseur').length}
          </div>
        </Card>
      </div>

      {/* Team List */}
      <Card className="shadow-premium overflow-hidden border-border" padding="none">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                  <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold">Collaborateur</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold">Rôle</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold hidden sm:table-cell">Chantiers</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase tracking-widest font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="hover:bg-muted/30 border-b border-border transition-colors">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold">
                          {member.nom_complet.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-size-xs font-semibold sm:text-size-sm">{member.nom_complet}</span>
                          <span className="truncate text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">ID:{member.id.slice(0, 6)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant={getRoleBadge(member.role) as any} className="text-[9px] uppercase tracking-widest h-5 px-1.5 font-semibold">
                        {member.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 hidden sm:table-cell">
                      <span className="text-xs font-medium">
                        {member.chantiers_assignes?.length || 0} sites
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Button variant="ghost" size="icon-sm" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="bg-muted/30 border-b p-6">
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription>
              Nouveau collaborateur administratif.
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-size-lg font-semibold">Invitation envoyée !</h3>
              <p className="text-size-xs text-muted-foreground">
                Un lien a été envoyé à l'adresse e-mail.
              </p>
              <Button onClick={() => setIsInviteModalOpen(false)} className="w-full">
                Fermer
              </Button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" name="name" required placeholder="Ex: Jean Dupont" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse E-mail</Label>
                  <Input id="email" name="email" type="email" required placeholder="jean@exemple.com" />
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <div className="grid gap-2">
                    {[
                      { value: 'chef_projet', label: 'Chef de Projet', desc: 'Accès chantiers assignés.' },
                      { value: 'superviseur', label: 'Superviseur', desc: 'Pointage et production.' },
                      { value: 'admin', label: 'Administrateur', desc: 'Accès complet.' },
                    ].map((r) => (
                      <Label key={r.value} className="flex items-start gap-3 p-2.5 rounded-md border border-border hover:bg-muted/50 cursor-pointer">
                        <input type="radio" name="role" value={r.value} required className="mt-1" />
                        <div className="grid gap-0.5">
                          <span className="text-size-xs font-semibold">{r.label}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">{r.desc}</span>
                        </div>
                      </Label>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsInviteModalOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Inviter'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
