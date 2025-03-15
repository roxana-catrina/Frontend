import { TestBed } from '@angular/core/testing';

import { ImagineService } from './imagine.service';

describe('ImagineService', () => {
  let service: ImagineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImagineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
