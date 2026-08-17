'use client';

import React, { useEffect, useState } from 'react';
import { getTeamMembers, inviteMember } from '@/lib/server/team.actions';
import {
  UserPlus,
  Loader2,
  MoreHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { label, ROLE_LABELS } from '@/lib/labels';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const hasMembers = members.length > 0;
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

  return (
    <div className="mx-auto max-w-7xl space-y-fluid-md p-fluid-sm sm:p-fluid-md">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-size-2xl font-medium text-foreground sm:text-size-3xl">Équipe</h1>
          <p className="hidden text-size-sm text-muted-foreground sm:block">Gérez les accès et les collaborateurs.</p>
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
      <div className="grid grid-cols-2 divide-y divide-x divide-border border border-border lg:grid-cols-3 lg:divide-y-0">
        <div className="p-4 sm:p-6">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-tabular mt-1.5 text-size-xl font-medium text-foreground sm:text-size-2xl">{members.length}</p>
        </div>
        <div className="p-4 sm:p-6">
          <p className="text-xs text-muted-foreground">Admins</p>
          <p className="font-tabular mt-1.5 text-size-xl font-medium text-foreground sm:text-size-2xl">
            {members.filter((m) => m.role === 'admin').length}
          </p>
        </div>
        <div className="hidden p-6 lg:block">
          <p className="text-xs text-muted-foreground">Superviseurs</p>
          <p className="font-tabular mt-1.5 text-size-2xl font-medium text-foreground">
            {members.filter((m) => m.role === 'superviseur').length}
          </p>
        </div>
      </div>

      {/* Team List */}
      <Card className="overflow-hidden border-border" padding="none">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaborateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="hidden sm:table-cell">Chantiers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="py-3">
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-size-sm font-medium text-foreground">{member.nom_complet}</span>
                        <span className="font-tabular truncate text-xs text-muted-foreground">ID {member.id.slice(0, 6)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-size-sm text-foreground">
                        {label(ROLE_LABELS, member.role)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 hidden sm:table-cell">
                      <span className="font-tabular text-size-sm text-muted-foreground">
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
          <DialogHeader className="border-b border-border p-6">
            <DialogTitle className="font-display text-xl font-medium">Inviter un membre</DialogTitle>
            <DialogDescription>
              Nouveau collaborateur administratif.
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-display text-size-lg font-medium">Invitation envoyée !</h3>
              <p className="text-size-sm text-muted-foreground">
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
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input id="email" name="email" type="email" required placeholder="jean@exemple.com" />
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <div className="grid gap-2">
                    {[
                      { value: 'chef_projet', label: 'Chef de projet', desc: 'Accès chantiers assignés.' },
                      { value: 'superviseur', label: 'Superviseur', desc: 'Pointage et production.' },
                      { value: 'admin', label: 'Administrateur', desc: 'Accès complet.' },
                    ].map((r) => (
                      <Label key={r.value} className="flex items-start gap-3 p-3 border border-border hover:bg-muted/50 cursor-pointer">
                        <input type="radio" name="role" value={r.value} required className="mt-1 accent-primary" />
                        <div className="grid gap-0.5">
                          <span className="text-size-sm font-medium text-foreground">{r.label}</span>
                          <span className="text-xs text-muted-foreground font-normal">{r.desc}</span>
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
