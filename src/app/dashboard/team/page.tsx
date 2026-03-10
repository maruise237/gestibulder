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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Équipe Admin</h1>
          <p className="text-sm text-muted-foreground">Gérez les accès et les collaborateurs de votre entreprise.</p>
        </div>
        <Button onClick={() => {
          setInviteSuccess(false);
          setIsInviteModalOpen(true);
        }}>
          <UserPlus className="mr-2 h-4 w-4" />
          Inviter un membre
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="font-medium text-muted-foreground">Total Membres</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="font-medium text-muted-foreground">Administrateurs</CardDescription>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter((m) => m.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription className="font-medium text-muted-foreground">Superviseurs</CardDescription>
            <HardHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter((m) => m.role === 'superviseur').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team List */}
      <Card>
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collaborateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Chantiers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {member.nom_complet.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{member.nom_complet}</span>
                        <span className="text-xs text-muted-foreground">ID: {member.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadge(member.role) as any}>
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {member.chantiers_assignes?.length || 0} sites assignés
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Inviter un membre</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau collaborateur à votre équipe administrative.
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-medium">Invitation envoyée !</h3>
              <p className="text-sm text-muted-foreground">
                Un lien a été envoyé à l'adresse e-mail renseignée.
              </p>
              <Button onClick={() => setIsInviteModalOpen(false)} className="w-full">
                Fermer
              </Button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" name="name" required placeholder="Ex: Jean Dupont" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse E-mail</Label>
                <Input id="email" name="email" type="email" required placeholder="jean@exemple.com" />
              </div>
              <div className="space-y-2">
                <Label>Attribution du rôle</Label>
                <div className="grid gap-2">
                  {[
                    { value: 'chef_projet', label: 'Chef de Projet', desc: 'Accès complet aux chantiers assignés.' },
                    { value: 'superviseur', label: 'Superviseur', desc: 'Pointage et production uniquement.' },
                    { value: 'admin', label: 'Administrateur', desc: 'Accès complet (Finances, Équipe).' },
                  ].map((r) => (
                    <Label key={r.value} className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-muted/50 cursor-pointer">
                      <input type="radio" name="role" value={r.value} required className="mt-1" />
                      <div className="grid gap-0.5">
                        <span className="font-medium">{r.label}</span>
                        <span className="text-xs text-muted-foreground font-normal">{r.desc}</span>
                      </div>
                    </Label>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={() => setIsInviteModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Envoyer l'invitation
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
